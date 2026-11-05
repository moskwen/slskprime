import { t } from '../../../lib/i18n';
import ErrorSegment from '../../Shared/ErrorSegment';
import Switch from '../../Shared/Switch';
import SearchListRow from './SearchListRow';
import React from 'react';
import { Card, Icon, Loader, Table } from 'semantic-ui-react';

const SearchList = ({
  connecting = false,
  error = undefined,
  onRemove = () => {},
  onStop = () => {},
  searches = {},
}) => {
  return (
    <Card
      className="search-list-card"
      raised
    >
      <Card.Content>
        <div className="search-list-wrapper">
          <Switch
            connecting={
              connecting && (
                <Loader
                  active
                  inline="centered"
                  size="small"
                />
              )
            }
            error={error && <ErrorSegment caption={error} />}
          >
            <Table
              className="unstackable"
              size="large"
            >
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell className="search-list-action">
                    <Icon name="info circle" />
                  </Table.HeaderCell>
                  <Table.HeaderCell className="search-list-phrase">{t("Search")}</Table.HeaderCell>
                  <Table.HeaderCell className="search-list-files">{t("Files")}</Table.HeaderCell>
                  <Table.HeaderCell className="search-list-locked">{t("Locked")}</Table.HeaderCell>
                  <Table.HeaderCell className="search-list-responses">{t("Responses")}</Table.HeaderCell>
                  <Table.HeaderCell className="search-list-started">{t("Ended")}</Table.HeaderCell>
                  <Table.HeaderCell className="search-list-action" />
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {Object.values(searches)
                  .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
                  .map((search) => (
                    <SearchListRow
                      key={search.id}
                      onRemove={onRemove}
                      onStop={onStop}
                      search={search}
                    />
                  ))}
              </Table.Body>
            </Table>
          </Switch>
        </div>
      </Card.Content>
    </Card>
  );
};

export default SearchList;
