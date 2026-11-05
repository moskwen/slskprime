import { t } from '../../lib/i18n';
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
  formatAttributes,
  formatBytes,
  formatSeconds,
  getFileName,
} from '../../lib/util';
import React, { useState } from 'react';
import { Button, Checkbox, Header, Icon, List, Table } from 'semantic-ui-react';

const FileList = ({
  directoryName,
  disabled,
  files,
  footer,
  locked,
  onClose,
  onDownloadDirectory,
  downloadPending,
  onSelectionChange,
}) => {
  const [folded, setFolded] = useState(false);

  return (
    <div className="studio-folder" style={{ opacity: locked ? 0.5 : 1 }}>
      <Header
        className="filelist-header"
        size="small"
      >
        <div className="studio-folder-heading">
          <Icon
            link={!locked}
            name={locked ? 'lock' : folded ? 'folder' : 'folder open'}
            onClick={() => !locked && setFolded(!folded)}
            size="large"
          />
          <span className="studio-folder-title" title={directoryName}>{directoryName.split(/[\\/]/).filter(Boolean).pop() || directoryName}<small>{directoryName}</small></span>
          {onDownloadDirectory && <div className="studio-folder-action"><span>{t("{0} files · {1}", [files.length, formatBytes(files.reduce((sum,f)=>sum+f.size,0))])}</span><Button size="small" color="green" icon="download" content={t("Download folder")} disabled={disabled || locked} loading={downloadPending} onClick={onDownloadDirectory} /></div>}

          {Boolean(onClose) && (
            <Icon
              className="close-button"
              color="red"
              link
              name="close"
              onClick={() => onClose()}
            />
          )}
        </div>
      </Header>
      {!folded && files && files.length > 0 && (
        <List>
          <List.Item>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell className="filelist-selector">
                    <Checkbox
                      checked={files.filter((f) => !f.selected).length === 0}
                      disabled={disabled}
                      fitted
                      onChange={(event, data) =>
                        files.map((f) => onSelectionChange(f, data.checked))
                      }
                    />
                  </Table.HeaderCell>
                  <Table.HeaderCell className="filelist-filename">{t("File")}</Table.HeaderCell>
                  <Table.HeaderCell className="filelist-size">{t("Size")}</Table.HeaderCell>
                  <Table.HeaderCell className="filelist-attributes">{t("Quality")}</Table.HeaderCell>
                  <Table.HeaderCell className="filelist-length">{t("Duration")}</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {files
                  .sort((a, b) => (a.filename > b.filename ? 1 : -1))
                  .map((f) => (
                    <Table.Row key={f.filename} className={f.selected ? 'studio-selected' : ''}>
                      <Table.Cell className="filelist-selector">
                        <Checkbox
                          checked={f.selected}
                          disabled={disabled}
                          fitted
                          onChange={(event, data) =>
                            onSelectionChange(f, data.checked)
                          }
                        />
                      </Table.Cell>
                      <Table.Cell className="filelist-filename">
                        {locked ? <Icon name="lock" /> : ''}
                        {getFileName(f.filename)}
                      </Table.Cell>
                      <Table.Cell className="filelist-size">
                        {formatBytes(f.size)}
                      </Table.Cell>
                      <Table.Cell className="filelist-attributes">
                        {formatAttributes(f)}
                      </Table.Cell>
                      <Table.Cell className="filelist-length">
                        {formatSeconds(f.length)}
                      </Table.Cell>
                    </Table.Row>
                  ))}
              </Table.Body>
              {footer && (
                <Table.Footer fullWidth>
                  <Table.Row>
                    <Table.HeaderCell colSpan="5">{footer}</Table.HeaderCell>
                  </Table.Row>
                </Table.Footer>
              )}
            </Table>
          </List.Item>
        </List>
      )}
    </div>
  );
};

export default FileList;
