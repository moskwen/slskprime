import api from './api';

export const getAll = async () => {
  return (await api.get('/searches')).data;
};

export const stop = ({ id }) => {
  return api.put(`/searches/${encodeURIComponent(id)}`);
};

export const remove = ({ id }) => {
  return api.delete(`/searches/${encodeURIComponent(id)}`);
};

export const create = ({ id, searchText, timeout }) => {
  return api.post('/searches', { id, searchText }, { timeout });
};

export const getStatus = async ({ id, includeResponses = false, timeout }) => {
  return (
    await api.get(
      `/searches/${encodeURIComponent(id)}?includeResponses=${includeResponses}`,
      { timeout },
    )
  ).data;
};

export const getResponses = async ({ id }) => {
  const response = (
    await api.get(`/searches/${encodeURIComponent(id)}/responses`)
  ).data;

  if (!Array.isArray(response)) {
    console.warn('got non-array response from searches API', response);
    return undefined;
  }

  return response;
};

const getNthMatch = (string, regex, n) => {
  const match = string.match(regex);

  if (match) {
    return Number.parseInt(match[n], 10);
  }

  return undefined;
};

export const parseFiltersFromString = (string) => {
  const tokens = string.toLowerCase().match(/-?"[^"]*"|\S+/gu) || [];
  const controls = tokens.filter(term => !term.includes('"')).join(' ');
  const filters = {
    exclude: [],
    include: [],
    isCBR: false,
    isLossless: false,
    isLossy: false,
    isVBR: false,
    minBitDepth: 0,
    minBitRate: 0,
    minFilesInFolder: 0,
    minFileSize: 0,
    minLength: 0,
  };

  filters.minBitRate =
    getNthMatch(controls, /(?:^|\s)(minbr|minbitrate):(\d+)(?=\s|$)/iu, 2) || filters.minBitRate;
  filters.minBitDepth =
    getNthMatch(controls, /(?:^|\s)(minbd|minbitdepth):(\d+)(?=\s|$)/iu, 2) ||
    filters.minBitDepth;
  filters.minFileSize =
    getNthMatch(controls, /(?:^|\s)(minfs|minfilesize):(\d+)(?=\s|$)/iu, 2) ||
    filters.minFileSize;
  filters.minLength =
    getNthMatch(controls, /(?:^|\s)(minlen|minlength):(\d+)(?=\s|$)/iu, 2) || filters.minLength;
  filters.minFilesInFolder =
    getNthMatch(controls, /(?:^|\s)(minfif|minfilesinfolder):(\d+)(?=\s|$)/iu, 2) ||
    filters.minFilesInFolder;

  filters.isVBR = tokens.includes('isvbr');
  filters.isCBR = tokens.includes('iscbr');
  filters.isLossless = tokens.includes('islossless');
  filters.isLossy = tokens.includes('islossy');

  const terms = tokens
    .filter(
      (term) =>
        (term.includes('"') || !term.includes(':')) &&
        term !== 'isvbr' &&
        term !== 'iscbr' &&
        term !== 'islossless' &&
        term !== 'islossy',
    );

  const unquote = (term) => term.replace(/^"|"$/gu, '');
  filters.include = terms.filter((term) => !term.startsWith('-')).map(unquote).filter(Boolean);
  filters.exclude = terms
    .filter((term) => term.startsWith('-'))
    .map((term) => unquote(term.slice(1))).filter(Boolean);

  return filters;
};

export const filterResponse = ({
  filters = {
    exclude: [],
    include: [],
    isCBR: false,
    isLossless: false,
    isLossy: false,
    isVBR: false,
    minBitDepth: 0,
    minBitRate: 0,
    minFileSize: 0,
    minLength: 0,
  },
  response = {
    files: [],
    lockedFiles: [],
  },
}) => {
  const { files = [], lockedFiles = [] } = response;

  if (
    response.fileCount + response.lockedFileCount <
    filters.minFilesInFolder
  ) {
    return { ...response, files: [], lockedFiles: [], fileCount: 0, lockedFileCount: 0 };
  }

  const filterFiles = (filesToFilter) =>
    filesToFilter.filter((file) => {
      const {
        bitRate,
        size,
        length,
        filename,
        sampleRate,
        bitDepth,
        isVariableBitRate,
      } = file;
      const {
        isCBR,
        isVBR,
        isLossless,
        isLossy,
        minBitRate,
        minBitDepth,
        minFileSize,
        minLength,
        include = [],
        exclude = [],
      } = filters;

      if (isCBR && (isVariableBitRate === undefined || isVariableBitRate))
        return false;
      if (isVBR && (isVariableBitRate === undefined || !isVariableBitRate))
        return false;
      if (isLossless && (!sampleRate || !bitDepth)) return false;
      if (isLossy && (sampleRate || bitDepth)) return false;
      if (minBitRate > 0 && !(bitRate >= minBitRate)) return false;
      if (minBitDepth > 0 && !(bitDepth >= minBitDepth)) return false;
      if (minFileSize > 0 && !(size >= minFileSize)) return false;
      if (minLength > 0 && !(length >= minLength)) return false;

      if (
        include.length > 0 &&
        include.filter((term) => filename.toLowerCase().includes(term))
          .length !== include.length
      ) {
        return false;
      }

      if (exclude.some((term) => filename.toLowerCase().includes(term)))
        return false;

      return true;
    });

  const filteredFiles = filterFiles(files);
  const filteredLockedFiles = filterFiles(lockedFiles);

  return {
    ...response,
    fileCount: filteredFiles.length,
    files: filteredFiles,
    lockedFileCount: filteredLockedFiles.length,
    lockedFiles: filteredLockedFiles,
  };
};
