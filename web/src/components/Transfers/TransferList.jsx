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
import { formatBytes, formatBytesAsUnit, getFileName } from '../../lib/util';
import TransferDetails from './TransferDetails';
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { toast } from 'react-toastify';
import * as searches from '../../lib/searches';
import { urlBase } from '../../config';
import {
  Button,
  Checkbox,
  Header,
  Icon,
  List,
  Popup,
  Progress,
  Table,
} from 'semantic-ui-react';

const getColor = (state) => {
  switch (state) {
    case 'InProgress':
      return { color: 'blue' };
    case 'Completed, Succeeded':
      return { color: 'green' };
    case 'Requested':
    case 'Queued, Locally':
    case 'Queued, Remotely':
    case 'Queued':
      return {};
    case 'Initializing':
      return { color: 'teal' };
    default:
      return { color: 'red' };
  }
};

const isRetryableState = (state) => getColor(state).color === 'red';
const isQueuedState = (state) => state.includes('Queued');

const formatBytesTransferred = ({ size, transferred }) => {
  const [s, sExtension] = formatBytes(size, 1).split(' ');
  const t = formatBytesAsUnit(transferred, sExtension, 1);

  return `${t}/${s} ${sExtension}`;
};

class TransferList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isFolded: false,
      findingAlternative: undefined,
    };
  }

  handleClick = (file) => {
    const { direction, state } = file;

    if (direction === 'Download') {
      if (isRetryableState(state)) {
        return this.props.onRetryRequested(file);
      }

      if (isQueuedState(state)) {
        return this.props.onPlaceInQueueRequested(file);
      }
    }

    return undefined;
  };

  toggleFolded = () => {
    this.setState((previousState) => ({ isFolded: !previousState.isFolded }));
  };

  findAlternative = async (file) => {
    if (this.state.findingAlternative) return;
    const searchText = getFileName(file.filename).replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim();
    const id = uuid();
    this.setState({ findingAlternative: file.id || file.filename });
    try {
      await searches.create({ id, searchText });
      this.props.history.push(`${urlBase}/searches/${id}`);
    } catch (error) {
      toast.error(error?.response?.data || error.message);
      this.setState({ findingAlternative: undefined });
    }
  };

  render() {
    const { directoryName, files, onSelectionChange } = this.props;
    const { isFolded } = this.state;
    const total = files.reduce((sum, f) => sum + f.size, 0);
    const received = files.reduce((sum, f) => sum + (f.bytesTransferred || 0), 0);
    const complete = files.filter(f => f.state === 'Completed, Succeeded').length;
    const percent = total ? Math.min(100, Math.round(received / total * 100)) : 0;

    return (
      <div>
        <Header
          className="filelist-header"
          size="small"
        >
          <Icon
            link
            name={isFolded ? 'folder' : 'folder open'}
            onClick={() => this.toggleFolded()}
          />
          {directoryName}
        </Header>
        <div className="studio-album-progress"><div><span>{t("{0}/{1} files completed", [complete, files.length])}</span><strong>{percent}%</strong></div><div className="studio-album-track"><span style={{width: percent + '%'}} /></div><small>{t("{0} of {1}", [formatBytes(received), formatBytes(total)])}</small></div>
        {isFolded === false ? (
          <List>
            <List.Item>
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell className="transferlist-selector">
                      <Checkbox
                        checked={files.filter((f) => !f.selected).length === 0}
                        fitted
                        onChange={(event, data) =>
                          files.map((file) =>
                            onSelectionChange(
                              directoryName,
                              file,
                              data.checked,
                            ),
                          )
                        }
                      />
                    </Table.HeaderCell>
                    <Table.HeaderCell className="transferlist-filename">{t("File")}</Table.HeaderCell>
                    <Table.HeaderCell className="transferlist-progress">{t("Progress")}</Table.HeaderCell>
                    <Table.HeaderCell className="transferlist-size">{t("Size")}</Table.HeaderCell>
                    <Table.HeaderCell className="transferlist-detail">
                      <Icon
                        name="info circle"
                        size="small"
                      />
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {files
                    .sort((a, b) =>
                      getFileName(a.filename).localeCompare(
                        getFileName(b.filename),
                      ),
                    )
                    .map((f) => (
                      <Table.Row key={f.filename}>
                        <Table.Cell className="transferlist-selector">
                          <Checkbox
                            checked={f.selected}
                            fitted
                            onChange={(event, data) =>
                              onSelectionChange(directoryName, f, data.checked)
                            }
                          />
                        </Table.Cell>
                        <Table.Cell className="transferlist-filename">
                          {getFileName(f.filename)}
                          {f.direction === 'Download' && (isRetryableState(f.state) || isQueuedState(f.state)) && <Button className="studio-alternative" size="mini" icon="search" content={t("Find another source")} title={t("Find another source without cancelling this download")} loading={this.state.findingAlternative === (f.id || f.filename)} disabled={Boolean(this.state.findingAlternative)} onClick={() => this.findAlternative(f)} />}
                        </Table.Cell>
                        <Table.Cell className="transferlist-progress">
                          {f.state === 'InProgress' ? (
                            <Progress
                              color={getColor(f.state).color}
                              percent={Math.round(f.percentComplete)}
                              progress
                              style={{ margin: 0 }}
                            />
                          ) : (
                            <Button
                              fluid
                              size="mini"
                              style={{
                                cursor: f.direction === 'Upload' ? 'unset' : '',
                                margin: 0,
                                padding: 7,
                              }}
                              {...getColor(f.state)}
                              {...(!getColor(f.state).color && f.attempts > 1
                                ? { color: 'yellow' }
                                : {})}
                              active={f.direction === 'Upload'}
                              onClick={() => this.handleClick(f)}
                            >
                              {f.direction === 'Download' &&
                                isQueuedState(f.state) && (
                                  <Icon name="refresh" />
                                )}
                              {f.direction === 'Download' &&
                                isRetryableState(f.state) && (
                                  <Icon name="redo" />
                                )}
                              {({'Completed, Succeeded':t("Completed"),'Queued, Remotely':t("Queued remotely"),'Queued, Locally':t("Queued locally"),'Requested':t("Requested"),'Initializing':t("Connecting"),'Completed, Cancelled':t("Cancelled"),'Completed, TimedOut':t("Timed out"),'Completed, Errored':t("Failed"),'Completed, Rejected':t("Rejected")})[f.state] || f.state}
                              {f.placeInQueue ? ` (#${f.placeInQueue})` : ''}
                              {f.attempts > 1 ? " " + t("(Retry #{0})", [f.attempts]) : ''}
                            </Button>
                          )}
                        </Table.Cell>
                        <Table.Cell className="transferlist-size">
                          <div
                            style={{
                              alignItems: 'center',
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>
                              {formatBytesTransferred({
                                size: f.size,
                                transferred: f.bytesTransferred,
                              })}
                            </span>
                          </div>
                        </Table.Cell>
                        <Table.Cell className="transferlist-detail">
                          <Popup
                            content={<TransferDetails file={f} />}
                            on="click"
                            position="left center"
                            style={{ maxWidth: '600px' }}
                            trigger={
                              <Icon
                                color="grey"
                                link
                                name="info circle"
                                size="small"
                              />
                            }
                            wide="very"
                          />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                </Table.Body>
              </Table>
            </List.Item>
          </List>
        ) : (
          ''
        )}
      </div>
    );
  }
}

export default withRouter(TransferList);
