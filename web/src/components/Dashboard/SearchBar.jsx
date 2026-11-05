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
import '../Search/Search.css';
import { urlBase } from '../../config';
import * as library from '../../lib/searches';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button, Icon, Input, Segment } from 'semantic-ui-react';
import { v4 as uuidv4 } from 'uuid';

const SearchBar = ({ server } = {}) => {
  const [creating, setCreating] = useState(false);

  const inputRef = useRef();
  const history = useHistory();

  const create = async ({ navigate = false } = {}) => {
    const ref = inputRef?.current?.inputRef?.current;
    const searchText = ref.value;
    const id = uuidv4();

    try {
      setCreating(true);
      await library.create({ id, searchText });

      ref.value = '';
      ref.focus();

      setCreating(false);

      if (navigate) {
        history.push(`${urlBase}/searches/${id}`);
      } else {
        const label =
          searchText.length > 30 ? `${searchText.slice(0, 15)}...` : searchText;
        toast.info(
          <span>{t("Search for ‘")}{label}{t("’ started.")}{' '}
            <Link to={`${urlBase}/searches/${id}`}>{t("View results")}</Link>
          </span>,
        );
      }
    } catch (createError) {
      console.error(createError);
      toast.error(
        createError?.response?.data ?? createError?.message ?? createError,
      );
      setCreating(false);
    }
  };

  useEffect(() => {
    inputRef?.current?.inputRef?.current?.focus();
  }, []);

  return (
    <Segment
      className="search-segment"
      raised
    >
      <div className="search-segment-icon">
        <Icon
          name="search"
          size="big"
        />
      </div>
      <Input
        action={
          <>
            <Button
              disabled={creating || !server?.isConnected}
              icon="plus"
              onClick={create}
            />
            <Button
              disabled={creating || !server?.isConnected}
              icon="search"
              content={t("Search")}
              onClick={() => create({ navigate: true })}
            />
          </>
        }
        className="search-input"
        disabled={creating || !server?.isConnected}
        input={
          <input
            data-lpignore="true"
            placeholder={
              server?.isConnected
                ? t("Artist, album or track…")
                : t("Connect to server to perform a search")
            }
            type="search"
          />
        }
        loading={creating}
        onKeyUp={(keyUpEvent) => (keyUpEvent.key === 'Enter' ? create({ navigate: true }) : '')}
        placeholder={t("Search phrase")}
        ref={inputRef}
        size="big"
      />
    </Segment>
  );
};

export default SearchBar;
