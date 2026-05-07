import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { EntityRow } from '../components/EntityRow';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { SelectField } from '../components/SelectField';
import { TopHero } from '../components/TopHero';
import { caService } from '../services/caService';
import { certificateService } from '../services/certificateService';
import { csrService } from '../services/csrService';
import { pickFile, saveExportFiles } from '../services/fileService';
import { theme } from '../theme';
import { formatDate, getDaysUntil, getExpiryBand } from '../utils/dateUtils';

const CERT_TYPES = ['SERVER', 'CLIENT', 'EMAIL', 'CODE_SIGNING'].map((t) => ({
  label: t,
  value: t,
}));

const initialImportForm = {
  common_name: "",
  cert_type: "SERVER",
  ca_id: "",
  selectedCertFile: null,
  selectedKeyFile: null,
};

const badgeToneFromStatus = (status, daysUntil) => {
  if (status === 'REVOKED') return 'danger';
  const band = getExpiryBand(daysUntil);
  if (band === 'critical' || band === 'expired') return 'danger';
  if (band === 'warning' || band === 'watch') return 'warning';
  return 'success';
};

export function CertificatesScreen({ reloadKey, onDataChanged }) {
  const [certificates, setCertificates] = useState([]);
  const [cas, setCas] = useState([]);
  const [casSummary, setCasSummary] = useState([]);
  const [csrs, setCsrs] = useState([]);
  const [csrsSummary, setCsrsSummary] = useState([]);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");
  const [signForm, setSignForm] = useState({
    csr_id: "",
    ca_id: "",
    validity_days: "365",
    cert_type: "SERVER",
  });
  const [importForm, setImportForm] = useState(initialImportForm);

  const notify = (title, message) => Alert.alert(title, message);

  const loadData = async () => {
    try {
      setError('');
      const [certificatesResult, casResult, csrsResult, casSummaryResult, csrsSummaryResult] = await Promise.all([
        certificateService.list(),
        caService.list(),
        csrService.list(),
        caService.summary(),
        csrService.summary(),
      ]);
      setCertificates(certificatesResult);
      setCas(casResult);
      setCsrs(csrsResult);
      setCasSummary(casSummaryResult);
      setCsrsSummary(csrsSummaryResult);
    } catch (loadError) {
      setError(loadError.message);
      notify("Echec", loadError.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [reloadKey]);

  const execute = async (action, successMessage) => {
    try {
      setError("");
      await action();
      notify("Succes", successMessage);
      await loadData();
      onDataChanged?.();
    } catch (actionError) {
      setError(actionError.message);
      notify("Echec", actionError.message);
    }
  };

  const signSelectedCsr = () =>
    execute(
      () =>
        csrService.submitForSigning(signForm.csr_id, {
          ca_id: Number(signForm.ca_id),
          validity_days: Number(signForm.validity_days),
          cert_type: signForm.cert_type,
        }),
      "Fichier .crt genere depuis le CSR et la CA selectionnes.",
    );

  const openDetails = async (certId) => {
    try {
      setError("");
      const result = await certificateService.details(certId);
      setDetails(result);
    } catch (detailError) {
      setError(detailError.message);
      notify("Echec", detailError.message);
    }
  };

  const revokeCertificate = async (item) => {
    await execute(
      () =>
        certificateService.update(item.cert_id, {
          status: "REVOKED",
          common_name: item.common_name,
          cert_type: item.cert_type,
          algorithm: item.algorithm,
          ca_id: item.ca_id,
        }),
      `${item.common_name} revoque.`,
    );
  };

  const importCertificate = () =>
    execute(
      () =>
        certificateService.importOne({
          common_name: importForm.common_name,
          cert_type: importForm.cert_type,
          ca_id: importForm.ca_id ? Number(importForm.ca_id) : null,
          file_format: importForm.selectedCertFile?.extension || "pem",
          certificate_base64: importForm.selectedCertFile?.base64,
          private_key_base64: importForm.selectedKeyFile?.base64,
        }),
      "CRT importe et ajoute a la liste des artefacts.",
    );

  const csrOptions = csrsSummary.map((c) => ({
    label: `[${c.csr_id}] ${c.common_name}`,
    value: String(c.csr_id),
  }));

  const caOptions = casSummary.map((ca) => ({
    label: `[${ca.ca_id}] ${ca.name}`,
    value: String(ca.ca_id),
  }));

  const crl = certificates.filter((item) => item.status === 'REVOKED');
  const pendingCsrs = csrs.filter((item) => item.status !== 'SIGNED');

  return (
    <ScreenContainer>
      <TopHero
        title="CRT"
        subtitle="Signature stricte depuis CSR + CA"
        meta="Equivalent OpenSSL x509 -req"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <SectionCard title="Signer un CSR en CRT">
        <SelectField
          label="CSR"
          value={signForm.csr_id}
          options={csrOptions}
          onChange={(v) => setSignForm({ ...signForm, csr_id: v })}
          placeholder="-- Choisir un CSR --"
        />
        <SelectField
          label="CA"
          value={signForm.ca_id}
          options={caOptions}
          onChange={(v) => setSignForm({ ...signForm, ca_id: v })}
          placeholder="-- Choisir une CA --"
        />
        <FormField label="Validite (jours)" value={signForm.validity_days} onChangeText={(v) => setSignForm({ ...signForm, validity_days: v })} placeholder="365" keyboardType="numeric" />
        <SelectField
          label="Type certificat"
          value={signForm.cert_type}
          options={CERT_TYPES}
          onChange={(v) => setSignForm({ ...signForm, cert_type: v })}
        />
        <PrimaryButton label="Signer et generer le .crt" onPress={signSelectedCsr} />
      </SectionCard>

      <SectionCard title="CSR disponibles">
        {pendingCsrs.length ? (
          pendingCsrs.map((item) => (
            <EntityRow
              key={item.csr_id}
              title={item.common_name}
              subtitle={`ID: ${item.csr_id} - ${item.algorithm || "N/A"} - ${item.status}`}
              meta={`CSR #${item.csr_id}`}
              badgeLabel="CSR"
              badgeTone="info"
              actions={
                null
              }
            />
          ))
        ) : (
          <Text style={styles.helper}>Aucun CSR en attente de signature.</Text>
        )}
      </SectionCard>

      <SectionCard title="CA disponibles">
        {cas.length ? (
          cas.map((item) => (
            <EntityRow
              key={item.ca_id}
              title={item.name}
              subtitle={`ID: ${item.ca_id} - ${item.ca_type || "CA"} - ${item.status}`}
              meta={`CA #${item.ca_id}`}
              badgeLabel="CA"
              badgeTone={item.ca_type === "ROOT" ? "accent" : "info"}
              actions={
                null
              }
            />
          ))
        ) : (
          <Text style={styles.helper}>Aucune CA disponible pour signer.</Text>
        )}
      </SectionCard>

      <SectionCard title="Importer un CRT existant">
        <SelectField
          label="Type"
          value={importForm.cert_type}
          options={CERT_TYPES}
          onChange={(v) => setImportForm({ ...importForm, cert_type: v })}
        />
        <FormField label="Common Name" value={importForm.common_name} onChangeText={(v) => setImportForm({ ...importForm, common_name: v })} placeholder="mail.mondomaine.com" />
        <SelectField
          label="CA (optionnel)"
          value={importForm.ca_id}
          options={caOptions}
          onChange={(v) => setImportForm({ ...importForm, ca_id: v })}
          placeholder="-- Aucune --"
        />
        <PrimaryButton compact tone="ghost" label={importForm.selectedCertFile?.name || 'Choisir certificat .crt / .pem'} onPress={async () => {
          const selectedFile = await pickFile();
          if (selectedFile) setImportForm({ ...importForm, selectedCertFile: selectedFile });
        }} />
        <PrimaryButton compact tone="ghost" label={importForm.selectedKeyFile?.name || 'Choisir cle privee'} onPress={async () => {
          const selectedFile = await pickFile();
          if (selectedFile) setImportForm({ ...importForm, selectedKeyFile: selectedFile });
        }} />
        <PrimaryButton label="Importer le CRT" onPress={importCertificate} />
      </SectionCard>

      <SectionCard
        title="Liste des CRT"
        subtitle="Touchez un certificat pour voir les details"
      >
        {certificates.map((item) => {
          const daysUntil = getDaysUntil(item.expires_at);
          return (
            <EntityRow
              key={item.cert_id}
              title={item.common_name}
              subtitle={`ID: ${item.cert_id} - ${item.cert_type || "CERT"} - ${item.algorithm || "N/A"}`}
              meta={`Expire le ${formatDate(item.expires_at)}${item.ca_name ? ` - signe par ${item.ca_name}` : ""}`}
              badgeLabel={item.status}
              badgeTone={badgeToneFromStatus(item.status, daysUntil)}
              onPress={() => openDetails(item.cert_id)}
              actions={
                <View style={styles.actions}>
                  <PrimaryButton
                    compact
                    tone="ghost"
                    label="Exporter"
                    onPress={() =>
                      execute(async () => {
                        const exported = await certificateService.exportOne(
                          item.cert_id,
                          "pem",
                        );
                        await saveExportFiles(exported.files);
                      }, `Export PEM de ${item.common_name} prepare.`)
                    }
                  />
                  <PrimaryButton
                    compact
                    tone="danger"
                    label="Revoquer"
                    onPress={() => revokeCertificate(item)}
                  />
                </View>
              }
            />
          );
        })}
      </SectionCard>

      <SectionCard title="Detail CRT" subtitle="CN, SANs, algorithme, validite">
        {details ? (
          <View style={styles.detailBox}>
            <Text style={styles.detailTitle}>{details.common_name}</Text>
            <Text style={styles.detailLine}>
              SANs: {(details.sans || []).join(", ") || "Aucun"}
            </Text>
            <Text style={styles.detailLine}>
              Signe par: {details.ca?.name || "Aucune CA"}
            </Text>
            <Text style={styles.detailLine}>
              Algorithme: {details.algorithm}
            </Text>
            <Text style={styles.detailLine}>
              Expiration: {formatDate(details.validity?.expires_at)}
            </Text>
            <Text style={styles.detailLine}>
              Sujet: {details.subject_dn || "N/A"}
            </Text>
            <Text style={styles.detailLine}>
              Empreinte SHA-256: {details.fingerprint_sha256 || "N/A"}
            </Text>
          </View>
        ) : (
          <Text style={styles.helper}>
            Selectionne un CRT pour afficher ses details.
          </Text>
        )}
      </SectionCard>

      <SectionCard
        title="CRL simple"
        subtitle="Liste locale des certificats revoques selon l'API"
      >
        {crl.length ? (
          crl.map((item) => (
            <EntityRow
              key={`crl-${item.cert_id}`}
              title={item.common_name}
              subtitle={`ID: ${item.cert_id} - Revoque - ${item.cert_type}`}
              meta={`Expiration initiale ${formatDate(item.expires_at)}`}
              badgeLabel="REVOKED"
              badgeTone="danger"
            />
          ))
        ) : (
          <Text style={styles.helper}>
            Aucun certificat revoque pour le moment.
          </Text>
        )}
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 8 },
  detailBox: {
    backgroundColor: "#063f27",
    borderRadius: 8,
    padding: 20,
    gap: 10,
  },
  detailTitle: {
    color: "#ebfff4",
    fontSize: 24,
    fontWeight: "800",
  },
  detailLine: {
    color: "#cae9d5",
    fontSize: 15,
    lineHeight: 22,
  },
  helper: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: "700",
  },
});