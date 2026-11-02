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
import Brand from './Brand';
import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  Form,
  Grid,
  Header,
  Icon,
  Input,
  Message,
  Segment,
} from 'semantic-ui-react';

const initialState = {
  password: '',
  rememberMe: true,
  username: '',
};

const LoginForm = ({ error, loading, onLoginAttempt }) => {
  const usernameInput = useRef();
  const [state, setState] = useState(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (state.username !== '' && state.password !== '') {
      setReady(true);
    } else {
      setReady(false);
    }
  }, [state]);

  useEffect(() => {
    usernameInput.current?.focus();
  }, [loading]);

  const handleChange = (field, value) => {
    setState({
      ...state,
      [field]: value,
    });
  };

  const { password, rememberMe, username } = state;

  return (
    <Grid
      style={{ height: '100vh' }}
      textAlign="center"
      verticalAlign="middle"
    >
      <Grid.Column style={{ maxWidth: 372 }}>
        <Header
          as="h2"
          style={{
            fontFamily: 'monospace',
            fontSize: 'inherit',
            letterSpacing: -1,
            lineHeight: 1.1,
            whiteSpace: 'pre',
          }}
          textAlign="center"
        >
          <div className="studio-login-brand"><Brand/></div>
        </Header>
        <Form size="large">
          <Segment raised>
            <Input
              disabled={loading}
              fluid
              icon="user"
              iconPosition="left"
              onChange={(event) => handleChange('username', event.target.value)}
              placeholder="Web interface username"
              ref={usernameInput}
            />
            <Form.Input
              disabled={loading}
              fluid
              icon="lock"
              iconPosition="left"
              onChange={(event) => handleChange('password', event.target.value)}
              placeholder="Password"
              type="password"
            />
            <Checkbox
              checked={rememberMe}
              disabled={loading}
              label="Remember me"
              onChange={() => handleChange('rememberMe', !rememberMe)}
            />
          </Segment>
          <Button
            className="login-button"
            disabled={!ready || loading}
            fluid
            loading={loading}
            onClick={() => onLoginAttempt(username, password, rememberMe)}
            primary
            size="large"
          >
            <Icon name="sign in" />
            Sign in
          </Button>
          {error && (
            <Message
              className="login-failure"
              floating
              negative
            >
              <Icon name="x" />
              {error.message}
            </Message>
          )}
        </Form>
      </Grid.Column>
    </Grid>
  );
};

export default LoginForm;
