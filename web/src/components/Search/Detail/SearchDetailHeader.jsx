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
import SearchStatusIcon from '../SearchStatusIcon';
import React from 'react';
import { saveWish } from '../../../lib/studio';
import { toast } from 'react-toastify';
import { useMediaQuery } from 'react-responsive';
import { Button, Header, Icon, Segment } from 'semantic-ui-react';

const RefreshButton = ({
  creating,
  disabled,
  isSmallScreen,
  isTinyScreen,
  loaded,
  onCreate,
  searchText,
  working,
}) =>
  loaded && (
    <Button
      disabled={disabled || working}
      icon={isSmallScreen && !isTinyScreen}
      loading={creating}
      onClick={() => onCreate({ navigate: true, search: searchText })}
    >
      <Icon name="refresh" />
      {(!isSmallScreen || isTinyScreen) && t("Search again")}
    </Button>
  );

const StopOrDeleteButton = ({
  isComplete,
  isSmallScreen,
  isTinyScreen,
  loaded,
  removing,
  stopOrRemove,
  stopping,
  working,
}) => (
  <Button
    disabled={working}
    floated={isTinyScreen ? 'right' : undefined}
    icon={isSmallScreen && !isTinyScreen}
    loading={removing || stopping}
    negative
    onClick={stopOrRemove}
  >
    <Icon name={isComplete ? 'trash alternate' : 'stop circle'} />
    {(!isSmallScreen || isTinyScreen) &&
      (loaded && isComplete ? t("Remove search") : t("Stop"))}
  </Button>
);

const SearchDetailHeader = ({
  creating,
  disabled,
  loaded,
  loading,
  onCreate,
  onRemove,
  onStop,
  removing,
  search,
  stopping,
}) => {
  const isSmallScreen = useMediaQuery({ query: '(max-width: 899px)' });
  const isTinyScreen = useMediaQuery({ query: '(max-width: 684px)' });

  const { isComplete, searchText, state } = search;
  const working = loading || creating || removing || stopping;

  const stopOrRemove = () => {
    if (isComplete) {
      onRemove(search);
    } else {
      onStop(search);
    }
  };

  // if the screen is full width, display the header and action buttons in the same segment, with full
  // button text.  if the screen is between 684 and 899 pixels, display the buttons with no text.
  // if the screen is less than 684 pixels, display the action buttons in a new segment, with full text.
  return (
    <>
      <Segment
        className="search-detail-header-segment"
        raised
      >
        <Header>
          <SearchStatusIcon state={state} />
          <span className="studio-eyebrow">{t("RESULTADOS DA BUSCA")}</span><span>{searchText}</span>
        </Header>
        {!isTinyScreen && (
          <div className="search-detail-header-buttons">
            <Button icon="bookmark outline" content={t("Save search")} onClick={()=>{saveWish(searchText);toast.success(t("Search saved"));}} />
            <RefreshButton
              creating={creating}
              disabled={disabled}
              isSmallScreen={isSmallScreen}
              isTinyScreen={isTinyScreen}
              loaded={loaded}
              onCreate={onCreate}
              searchText={searchText}
              working={working}
            />
            <StopOrDeleteButton
              isComplete={isComplete}
              isSmallScreen={isSmallScreen}
              isTinyScreen={isTinyScreen}
              loaded={loaded}
              removing={removing}
              stopOrRemove={stopOrRemove}
              stopping={stopping}
              working={working}
            />
          </div>
        )}
      </Segment>
      {isTinyScreen && (
        <Segment>
          <RefreshButton
            creating={creating}
            disabled={disabled}
            isSmallScreen={isSmallScreen}
            isTinyScreen={isTinyScreen}
            loaded={loaded}
            onCreate={onCreate}
            searchText={searchText}
            working={working}
          />
          <StopOrDeleteButton
            isComplete={isComplete}
            isSmallScreen={isSmallScreen}
            isTinyScreen={isTinyScreen}
            loaded={loaded}
            removing={removing}
            stopOrRemove={stopOrRemove}
            stopping={stopping}
            working={working}
          />
        </Segment>
      )}
    </>
  );
};

export default SearchDetailHeader;
