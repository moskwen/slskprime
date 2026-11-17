import { t } from '../../../lib/i18n';
import {
  CodeEditor,
  LoaderSegment,
  ShrinkableButton,
  Switch,
} from '../../Shared';
import {useLocation} from 'react-router-dom';
import Info from '../Info';
import SettingsForm from './SettingsForm';
import DebugModal from './DebugModal';
import EditModal from './EditModal';
import React, { useEffect, useState } from 'react';
import { Divider } from 'semantic-ui-react';
import YAML from 'yaml';

const DebugButton = ({
  debug,
  remoteConfiguration,
  setDebugModal,
  ...props
}) => {
  if (!remoteConfiguration || !debug) return null;

  return (
    <ShrinkableButton
      icon="bug"
      mediaQuery="(max-width: 516px)"
      onClick={() => setDebugModal(true)}
      {...props}
    >{t("Debug View")}</ShrinkableButton>
  );
};

const EditButton = ({ remoteConfiguration, setEditModal, ...props }) => {
  if (!remoteConfiguration) {
    return (
      <ShrinkableButton
        disabled
        icon="lock"
        mediaQuery="(max-width: 516px)"
      >{t("Remote Configuration Disabled")}</ShrinkableButton>
    );
  }

  return (
    <ShrinkableButton
      icon="edit"
      mediaQuery="(max-width: 516px)"
      onClick={() => setEditModal(true)}
      primary
      {...props}
    >{t("Edit")}</ShrinkableButton>
  );
};

const Options = ({ options, state={}, theme }) => {
  const location=useLocation();
  const [advanced,setAdvanced]=useState(location.hash.startsWith('#advanced'));
  const [infoOpen,setInfoOpen]=useState(location.hash==='#advanced-info');
  useEffect(()=>{if(location.hash.startsWith('#advanced'))setAdvanced(true);if(location.hash==='#advanced-info')setInfoOpen(true);},[location.hash]);
  const [debugModal, setDebugModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [contents, setContents] = useState();

  useEffect(() => {
    setTimeout(() => {
      setContents(
        YAML.stringify(options, { simpleKeys: true, sortMapEntries: false }),
      );
    }, 250);
  }, [options]);

  const { debug, remoteConfiguration } = options;

  return (
    <>
      <SettingsForm options={options}/>
      <details open={advanced} className="classic-advanced-options" onToggle={event=>setAdvanced(event.currentTarget.open)}><summary>{t('Advanced configuration')}</summary>
      {advanced&&<>
      <details open={infoOpen} onToggle={event=>setInfoOpen(event.currentTarget.open)} className="classic-advanced-info"><summary>{t('Info')}</summary>{infoOpen&&<Info state={state} theme={theme}/>}</details>
      <div className="header-buttons">
        <DebugButton
          debug={debug}
          disabled={!contents}
          remoteConfiguration={remoteConfiguration}
          setDebugModal={setDebugModal}
        />
        <EditButton
          disabled={!contents}
          remoteConfiguration={remoteConfiguration}
          setEditModal={setEditModal}
        />
      </div>
      <Divider />
      <Switch loading={!contents && <LoaderSegment />}>
        <CodeEditor
          basicSetup={false}
          editable={false}
          theme={theme}
          value={contents}
        />
      </Switch>
      </>}</details>
      <DebugModal
        onClose={() => setDebugModal(false)}
        open={debugModal}
        theme={theme}
      />
      <EditModal
        onClose={() => setEditModal(false)}
        open={editModal}
        theme={theme}
      />
    </>
  );
};

export default Options;
