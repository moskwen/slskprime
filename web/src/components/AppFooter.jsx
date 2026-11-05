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
import { urlBase } from '../config';
import { formatBytes } from '../lib/util';
import React from 'react';
import { Icon, Menu } from 'semantic-ui-react';

const formatSpeed = (bytesPerSecond) => {
  if (!bytesPerSecond || bytesPerSecond < 1) {
    return '   0 B/s';
  }

  return `${formatBytes(bytesPerSecond, 1, 4, ' ')}/s`;
};

const AppFooter = ({
  server = {},
  transferMetrics = {},
  user = {},
  version = {},
}) => {
  const { isConnected } = server;
  const { username } = user;
  const { current } = version;
  // const { downloads, uploads } = transferMetrics ?? {};
  const downloadSpeed = transferMetrics?.downloads?.inProgress?.averageSpeed;
  const downloadActive = transferMetrics?.downloads?.inProgress?.files ?? 0;
  const downloadQueued = transferMetrics?.downloads?.queued?.files ?? 0;
  const uploadSpeed = transferMetrics?.uploads?.inProgress?.averageSpeed;
  const uploadActive = transferMetrics?.uploads?.inProgress?.files ?? 0;
  const uploadQueued = transferMetrics?.uploads?.queued?.files ?? 0;

  return (
    <Menu
      className="footer"
      inverted
    >
      <Menu.Item>
        <Icon
          color={isConnected ? 'green' : 'red'}
          name="circle"
        />
        {isConnected ? username : 'Disconnected'}
      </Menu.Item>
      <Menu.Item>
        <Icon
          color="blue"
          name="arrow down"
        />
        <span className="footer-download">{formatSpeed(downloadSpeed)}</span>
        <span className="footer-stat-detail">
          {downloadActive} active &middot; {downloadQueued} queued
        </span>
      </Menu.Item>
      <Menu.Item>
        <Icon
          color="green"
          name="arrow up"
        />
        <span className="footer-upload">{formatSpeed(uploadSpeed)}</span>
        <span className="footer-stat-detail">
          {uploadActive} active &middot; {uploadQueued} queued
        </span>
      </Menu.Item>
      <Menu.Menu position="right">
        <Menu.Item as="a" href="https://github.com/moskwen/slskprime/tree/v0.2.0">Source code</Menu.Item>
        <Menu.Item
          as="a"
          href="https://github.com/moskwen/slskprime/blob/main/NOTICE"
          rel="noreferrer"
          target="_blank"
        >
          <img
            alt=""
            className="footer-logo"
            src={`${urlBase}/prime-icon.svg`}
          />
          slskprime v0.2.0 · modified frontend
          <span className="footer-version">based on slskd {current}</span>
          <span className="footer-license">AGPLv3</span>
        </Menu.Item>
      </Menu.Menu>
    </Menu>
  );
};

export default AppFooter;
