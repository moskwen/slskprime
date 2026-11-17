import { t } from '../../lib/i18n';
import './System.css';
import {urlBase} from '../../config';
import { Switch } from '../Shared';
import Data from './Data';
import Events from './Events';
import Files from './Files';
import Logs from './Logs';
import Options from './Options';
import Shares from './Shares';
import React from 'react';
import { Redirect, useHistory, useRouteMatch } from 'react-router-dom';
import { Icon, Menu, Segment, Tab } from 'semantic-ui-react';

const System = ({ options = {}, state = {}, theme }) => {
  const {
    params: { tab },
    ...route
  } = useRouteMatch();
  const history = useHistory();

  const panes = [
    {
      menuItem: {
        content: t("Options"),
        icon: 'options',
        key: 'options',
      },
      render: () => (
        <Tab.Pane className="full-height">
          <Options
            state={state}
            options={options}
            theme={theme}
          />
        </Tab.Pane>
      ),
      route: 'options',
    },
    {
      menuItem: (
        <Menu.Item key="shares">
          <Switch
            scanPending={
              (state?.shares?.scanPending ?? false) && (
                <Icon
                  color="yellow"
                  name="exclamation circle"
                />
              )
            }
          >
            <Icon name="share external" />
          </Switch>{t("Shares")}</Menu.Item>
      ),
      render: () => (
        <Tab.Pane>
          <Shares
            options={options}
            state={state.shares}
            theme={theme}
          />
        </Tab.Pane>
      ),
      route: 'shares',
    },
    {
      menuItem: {
        content: t("Files"),
        icon: 'folder open',
        key: 'files',
      },
      render: () => (
        <Tab.Pane className="full-height">
          <Files
            options={options}
            theme={theme}
          />
        </Tab.Pane>
      ),
      route: 'files',
    },
    {
      menuItem: {
        content: t("Data"),
        icon: 'database',
        key: 'data',
      },
      render: () => (
        <Tab.Pane className="full-height">
          <Data theme={theme} />
        </Tab.Pane>
      ),
      route: 'data',
    },
    {
      menuItem: {
        content: t("Events"),
        icon: 'calendar check',
        key: 'events',
      },
      render: () => (
        <Tab.Pane className="full-height">
          <Events />
        </Tab.Pane>
      ),
      route: 'events',
    },
    {
      menuItem: {
        content: t("Logs"),
        icon: 'file outline',
        key: 'logs',
      },
      render: () => (
        <Tab.Pane>
          <Logs />
        </Tab.Pane>
      ),
      route: 'logs',
    },
  ];

  const activeIndex = panes.findIndex((pane) => pane.route === tab);

  const onTabChange = (_event, { activeIndex: newActiveIndex }) => {
    history.push(panes[newActiveIndex].route);
  };

  if (tab === 'info') return <Redirect to={`${urlBase}/system/options#advanced-info`} />;

  if (tab === undefined) {
    return <Redirect to={`${route.url}/${panes[0].route}`} />;
  }

  return (
    <div className="system">
      <Segment raised>
        <Tab
          activeIndex={activeIndex > -1 ? activeIndex : 0}
          onTabChange={onTabChange}
          panes={panes}
        />
      </Segment>
    </div>
  );
};

export default System;
