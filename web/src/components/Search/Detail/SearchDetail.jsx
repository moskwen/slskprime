import { t } from '../../../lib/i18n';
/*
 * Copyright (c) 2026 slskprime contributors.
 * Modified: independent branding, English UI, compact design and browser-local discovery tools.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, version 3.
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 * This program is distributed with Additional Terms pursuant to Section 7
 * of the AGPLv3. See the LICENSE file for the complete terms and conditions.
 */
import {
  filterResponse,
  getResponses,
  parseFiltersFromString,
} from '../../../lib/searches';
import { isSourceBlocked } from '../../../lib/studio';
import { isFavorite } from '../../StudioFavorites';
import { sleep } from '../../../lib/util';
import ErrorSegment from '../../Shared/ErrorSegment';
import LoaderSegment from '../../Shared/LoaderSegment';
import Switch from '../../Shared/Switch';
import Response from '../Response';
import SearchDetailHeader from './SearchDetailHeader';
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Dropdown, Input, Segment } from 'semantic-ui-react';

const defaultsKey = 'soulspool-search-defaults-v1';
function readDefaults() { try { const d=JSON.parse(localStorage.getItem(defaultsKey))||{}; return { resultSort:['recommended','uploadSpeed','queueLength'].includes(d.resultSort)?d.resultSort:'recommended',hideLocked:d.hideLocked!==false,hideNoFreeSlots:d.hideNoFreeSlots===true,foldResults:d.foldResults===true,resultFilters:typeof d.resultFilters==='string'?d.resultFilters:'',favoritesOnly:d.favoritesOnly===true }; } catch { return {resultSort:'recommended',hideLocked:true}; } }
const sortDropdownOptions = [
  { key: 'recommended', text: t("Best sources first"), value: 'recommended' },
  {
    key: 'uploadSpeed',
    text: t("Fastest upload"),
    value: 'uploadSpeed',
  },
  {
    key: 'queueLength',
    text: t("Shortest queue"),
    value: 'queueLength',
  },
];

const SearchDetail = ({
  creating,
  disabled,
  onCreate,
  onRemove,
  onStop,
  removing,
  search,
  stopping,
}) => {
  const { fileCount, id, isComplete, lockedFileCount, responseCount, state } =
    search;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(undefined);

  const [results, setResults] = useState([]);

  // filters and sorting options
  const [hiddenResults, setHiddenResults] = useState([]);
  const [defaults] = useState(readDefaults);
  const [savedDefaults,setSavedDefaults] = useState(false);
  const [resultSort, setResultSort] = useState(defaults.resultSort);
  const [hideLocked, setHideLocked] = useState(defaults.hideLocked ?? true);
  const [hideNoFreeSlots, setHideNoFreeSlots] = useState(defaults.hideNoFreeSlots ?? false);
  const [foldResults, setFoldResults] = useState(defaults.foldResults ?? false);
  const [resultFilters, setResultFilters] = useState(defaults.resultFilters ?? '');
  const [blockedVersion,setBlockedVersion]=useState(0);
  useEffect(()=>{const update=()=>setBlockedVersion(v=>v+1);window.addEventListener("studio-preferences",update);return()=>window.removeEventListener("studio-preferences",update);},[]);
  const [favoritesOnly, setFavoritesOnly] = useState(defaults.favoritesOnly ?? false);
  const [displayCount, setDisplayCount] = useState(5);

  // when the search transitions from !isComplete -> isComplete,
  // fetch the results from the server
  useEffect(() => {
    const get = async () => {
      try {
        setLoading(true);

        // the results may not be ready yet.  this is very rare, but
        // if it happens the search will complete with no results.
        await sleep(500);

        const responses = await getResponses({ id });
        setResults(responses);
        setLoading(false);
      } catch (getError) {
        setError(getError);
        setLoading(false);
      }
    };

    if (isComplete) {
      get();
    }
  }, [id, isComplete]);

  // apply sorting and filters.  this can take a while for larger result
  // sets, so memoize it.
  const sortedAndFilteredResults = useMemo(() => {
    const sortOptions = {
      queueLength: { field: 'queueLength', order: 'asc' },
      uploadSpeed: { field: 'uploadSpeed', order: 'desc' },
    };

    const { field, order } = sortOptions[resultSort] || sortOptions.uploadSpeed;

    const filters = parseFiltersFromString(resultFilters);

    return results
      .filter((r) => !hiddenResults.includes(r.username) && !isSourceBlocked(r.username))
      .filter((r) => !favoritesOnly || isFavorite(r.username))
      .map((r) => {
        if (hideLocked) {
          return { ...r, lockedFileCount: 0, lockedFiles: [] };
        }

        return r;
      })
      .map((response) => filterResponse({ filters, response }))
      .filter((r) => r.fileCount + r.lockedFileCount > 0)
      .filter((r) => !(hideNoFreeSlots && !r.hasFreeUploadSlot))
      .sort((a, b) => {
        if (resultSort === 'recommended') return Number(b.hasFreeUploadSlot) - Number(a.hasFreeUploadSlot) || a.queueLength - b.queueLength || b.uploadSpeed - a.uploadSpeed;
        if (order === 'asc') {
          return a[field] - b[field];
        }

        return b[field] - a[field];
      });
  }, [
    blockedVersion,
    favoritesOnly,
    hiddenResults,
    hideLocked,
    hideNoFreeSlots,
    resultFilters,
    resultSort,
    results,
  ]);

  // when a user uses the action buttons, we will *probably* re-use this component,
  // but with a new search ID.  clear everything to prepare for the transition
  const reset = () => {
    setLoading(false);
    setError(undefined);
    setResults([]);
    setHiddenResults([]);
    setDisplayCount(5);
  };

  const create = async ({ navigate, search: searchForCreate }) => {
    reset();
    onCreate({ navigate, search: searchForCreate });
  };

  const remove = async () => {
    reset();
    onRemove(search);
  };

  const filteredCount = results?.length - sortedAndFilteredResults.length;
  const remainingCount = sortedAndFilteredResults.length - displayCount;
  const loaded = !removing && !creating && !loading && results;

  if (error) {
    return <ErrorSegment caption={error?.message ?? error} />;
  }

  return (
    <>
      <SearchDetailHeader
        creating={creating}
        disabled={disabled}
        loaded={loaded}
        loading={loading}
        onCreate={create}
        onRemove={remove}
        onStop={onStop}
        removing={removing}
        search={search}
        stopping={stopping}
      />
      <Switch
        loading={loading && <LoaderSegment />}
        searching={
          !isComplete && (
            <LoaderSegment>
              {state === 'InProgress'
                ? t("Found {0} files {1}from {2} users", [fileCount, lockedFileCount > 0
                      ? `(plus ${lockedFileCount} locked) `
                      : '', responseCount])
                : t("Loading results...")}
            </LoaderSegment>
          )
        }
      >
        {loaded && (
          <Segment
            className="search-options"
            raised
          >
            <div className="studio-results-summary"><span><strong>{sortedAndFilteredResults.length}</strong>{" " + t("sources found")}</span></div>
            <Button size="small" icon="save" content={savedDefaults?t("Default saved"):t("Save filters as default")} onClick={()=>{localStorage.setItem(defaultsKey,JSON.stringify({resultSort,hideLocked,hideNoFreeSlots,foldResults,resultFilters,favoritesOnly}));setSavedDefaults(true);}}/>
            <div className="studio-quick-filters">
              {[[t("All"),''],[t("Lossless"),'islossless'],['24 bits','minbitdepth:24'],[t("MP3 320"),'islossy minbitrate:320']].map(([label,value]) => <button type="button" className={resultFilters===value ? 'active' : ''} key={label} onClick={()=>setResultFilters(value)}>{label}</button>)}
              <button type="button" className={favoritesOnly?'active':''} onClick={()=>setFavoritesOnly(!favoritesOnly)}>{t("★ Favorites")}</button>
            </div>
            <Dropdown
              button
              className="search-options-sort icon"
              floating
              icon="sort"
              labeled
              onChange={(_event, { value }) => setResultSort(value)}
              options={sortDropdownOptions}
              text={
                sortDropdownOptions.find((o) => o.value === resultSort).text
              }
            />
            <div className="search-option-toggles">
              <Checkbox
                checked={hideLocked}
                className="search-options-hide-locked"
                label={t("Hide locked files")}
                onChange={() => setHideLocked(!hideLocked)}
                toggle
              />
              <Checkbox
                checked={hideNoFreeSlots}
                className="search-options-hide-no-slots"
                label={t("Free upload slots only")}
                onChange={() => setHideNoFreeSlots(!hideNoFreeSlots)}
                toggle
              />
              <Checkbox
                checked={foldResults}
                className="search-options-fold-results"
                label={t("Collapse tracks")}
                onChange={() => setFoldResults(!foldResults)}
                toggle
              />
            </div>
            <Input
              action={
                Boolean(resultFilters) && {
                  color: 'red',
                  icon: 'x',
                  onClick: () => setResultFilters(''),
                }
              }
              className="search-filter"
              label={{ content: t("Filter"), icon: 'filter' }}
              onChange={(_event, data) => setResultFilters(data.value)}
              placeholder={t("e.g. islossless \"deluxe edition\" -\"live at\"")}
              value={resultFilters}
            />
            <p className="studio-note">{t("Use \"exact phrases\", -word or -\"excluded phrase\". Quality: islossless, minbitrate:320, minbitdepth:24.")}</p>
          </Segment>
        )}
        {loaded &&
          sortedAndFilteredResults.slice(0, displayCount).map((r) => (
            <Response
              disabled={disabled}
              isInitiallyFolded={foldResults}
              key={r.username}
              onHide={() => setHiddenResults([...hiddenResults, r.username])}
              response={r}
            />
          ))}
        {loaded &&
          (remainingCount > 0 ? (
            <Button
              className="showmore-button"
              fluid
              onClick={() => setDisplayCount(displayCount + 5)}
              primary
              size="large"
            >{t("Show more {0} sources{1}{2}", [remainingCount > 5 ? 5 : remainingCount, ' ', t("({0} remaining, {1} hidden by filter(s))", [remainingCount, filteredCount])])}</Button>
          ) : filteredCount > 0 ? (
            <Button
              className="showmore-button"
              disabled
              fluid
              size="large"
            >{t("All results shown. {0} results hidden by filter(s)", [filteredCount])}</Button>
          ) : (
            ''
          ))}
      </Switch>
    </>
  );
};

export default SearchDetail;
