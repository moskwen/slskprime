import { t } from '../lib/i18n';
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
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { urlBase } from '../config';
import { Icon } from 'semantic-ui-react';

export default function StudioHeading() {
  const { pathname } = useLocation();
  const section = pathname.split('/').filter(Boolean).find(p => ['searches','downloads','uploads','favorites','dashboard','system','browse','users','user-info','chat','rooms'].includes(p)) || 'dashboard';
  const titles = {dashboard:t("Overview"),searches:t("Search"),downloads:t("Downloads"),uploads:t("Uploads"),favorites:t("Favorites"),system:t("Settings"),browse:t("Browse files"),users:t("Users"),'user-info':t("Look up user"),chat:t("Messages"),rooms:t("Rooms")};
  return <header className="studio-topbar"><div><h1>{titles[section]}</h1></div><div className="studio-topbar-actions"><Link to={`${urlBase}/searches`} className="studio-search-shortcut"><Icon name="search"/>{t("New search")}</Link><span className="studio-avatar" title="slskprime">P</span></div></header>;
}
