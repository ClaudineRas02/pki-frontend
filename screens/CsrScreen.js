import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { EntityRow } from '../components/EntityRow';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { TopHero } from '../components/TopHero';
import { csrService } from '../services/csrService';
import { pickFile, saveExportFiles } from '../services/fileService';
import { theme } from '../theme';
import { formatDate } from '../utils/dateUtils';

const initialCsrForm = {
  common_name: '',
  algorithm: 'RSA-2048',
  san_list: '',
  organization: '',
  country: '',
  state: '',
  locality: '',
  organizational_unit: '',
  email_address: '',
  selectedKeyFile: null,
};

export function CsrScreen({ reloadKey, onDataChanged }) {
  const [csrs, setCsrs] = useState([]);
  const [error, setError] = useState('');
  const [csrForm, setCsrForm] = useState(initialCsrForm);
  const [importForm, setImportForm] = useState({
    common_name: '',
    selectedFile: null,
  });

  const notify = (title, message) => Alert.alert(title, message);

  const loadCsrs = async () => {
    try {
      setError('');
      const result = await csrService.list();
      setCsrs(result);
    } catch (loadError) {
      setError(loadError.message);
      notify('Echec', loadError.message);
    }
  };

  useEffect(() => {
    loadCsrs();
  }, [reloadKey]);

  const execute = async (action, successMessage) => {
    try {
      setError('');
      await action();
      notify('Succes', successMessage);
      await loadCsrs();
      onDataChanged?.();
    } catch (actionError) {
      setError(actionError.message);
      notify('Echec', actionError.message);
    }
  };

  const generateCsr = () =>
    execute(
      () =>
        csrService.create({
          common_name: csrForm.common_name,
          algorithm: csrForm.algorithm,
          san_list: csrForm.san_list,
          organization: csrForm.organization,
          country: csrForm.country,
          state: csrForm.state,
          locality: csrForm.locality,
          organizational_unit: csrForm.organizational_unit,
          email_address: csrForm.email_address,
          private_key_base64: csrForm.selectedKeyFile?.base64,
        }),
      csrForm.selectedKeyFile
        ? 'Fichier .csr genere depuis la cle privee uploadée.'
        : 'Fichier .csr et cle privee generes.',
    );

  const importCsr = () =>
    execute(
      () =>
        csrService.importOne({
          common_name: importForm.common_name,
          csr_base64: importForm.selectedFile?.base64,
        }),
      'CSR importe et ajoute a la liste des artefacts.',
    );

  const exportCsr = (item) =>
    execute(async () => {
      const exported = await csrService.exportOne(item.csr_id);
      await saveExportFiles(exported.files);
    }, `Export du CSR ${item.common_name} prepare.`);

  return (
    <ScreenContainer>
      <TopHero title="CSR" subtitle="Cle, sujet, domaines, fichier .csr" meta="Point d'entree PKI" />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <SectionCard title="1. Cle privee">
        <Text style={styles.helper}>
          Uploade une cle existante ou laisse vide pour generer une nouvelle cle avec OpenSSL.
        </Text>
        <PrimaryButton
          compact
          tone="ghost"
          label={csrForm.selectedKeyFile?.name || 'Uploader une .key'}
          onPress={async () => {
            const selectedKeyFile = await pickFile();
            if (selectedKeyFile) {
              setCsrForm({ ...csrForm, selectedKeyFile });
            }
          }}
        />
        {csrForm.selectedKeyFile ? (
          <PrimaryButton
            compact
            tone="soft"
            label="Utiliser une cle generee"
            onPress={() => setCsrForm({ ...csrForm, selectedKeyFile: null })}
          />
        ) : null}
      </SectionCard>

      <SectionCard title="2. Sujet et domaines">
        <FormField label="Common Name" value={csrForm.common_name} onChangeText={(value) => setCsrForm({ ...csrForm, common_name: value })} placeholder="api.mondomaine.com" />
        <FormField label="SANs" value={csrForm.san_list} onChangeText={(value) => setCsrForm({ ...csrForm, san_list: value })} placeholder="api.mondomaine.com,*.mondomaine.com" />
        <FormField label="Organisation" value={csrForm.organization} onChangeText={(value) => setCsrForm({ ...csrForm, organization: value })} placeholder="MonEntreprise" />
        <FormField label="Pays" value={csrForm.country} onChangeText={(value) => setCsrForm({ ...csrForm, country: value })} placeholder="MG" />
        <FormField label="Etat / Region" value={csrForm.state} onChangeText={(value) => setCsrForm({ ...csrForm, state: value })} placeholder="Analamanga" />
        <FormField label="Localite" value={csrForm.locality} onChangeText={(value) => setCsrForm({ ...csrForm, locality: value })} placeholder="Antananarivo" />
        <FormField label="Unite" value={csrForm.organizational_unit} onChangeText={(value) => setCsrForm({ ...csrForm, organizational_unit: value })} placeholder="DevSecOps" />
        <FormField label="Email" value={csrForm.email_address} onChangeText={(value) => setCsrForm({ ...csrForm, email_address: value })} placeholder="pki@entreprise.com" />
        <FormField label="Algorithme" value={csrForm.algorithm} onChangeText={(value) => setCsrForm({ ...csrForm, algorithm: value })} placeholder="RSA-2048" />
        <PrimaryButton label="Generer le fichier .csr" onPress={generateCsr} />
      </SectionCard>

      <SectionCard title="Importer un CSR">
        <FormField label="Common Name" value={importForm.common_name} onChangeText={(value) => setImportForm({ ...importForm, common_name: value })} placeholder="external.mondomaine.com" />
        <PrimaryButton compact tone="ghost" label={importForm.selectedFile?.name || 'Choisir fichier .csr'} onPress={async () => {
          const selectedFile = await pickFile();
          if (selectedFile) {
            setImportForm({ ...importForm, selectedFile });
          }
        }} />
        <PrimaryButton label="Importer le .csr" onPress={importCsr} />
      </SectionCard>

      <SectionCard title="Liste des CSR">
        {csrs.length ? csrs.map((item) => (
          <EntityRow
            key={item.csr_id}
            title={item.common_name}
            subtitle={`${item.algorithm || 'N/A'} - fichier .csr ${item.csr_path ? 'present' : 'absent'}`}
            meta={`Cree le ${formatDate(item.created_at)}${item.ca_name ? ` - signe par ${item.ca_name}` : ''}`}
            badgeLabel={item.status}
            badgeTone={item.status === 'SIGNED' ? 'success' : 'info'}
            actions={
              <View style={styles.actions}>
                <PrimaryButton compact tone="ghost" label="Exporter" onPress={() => exportCsr(item)} />
              </View>
            }
          />
        )) : (
          <Text style={styles.helper}>Aucun CSR genere ou importe pour le moment.</Text>
        )}
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 8,
  },
  helper: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
});
