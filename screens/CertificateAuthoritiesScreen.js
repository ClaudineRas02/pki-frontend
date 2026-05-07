import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { EntityRow } from "../components/EntityRow";
import { FormField } from "../components/FormField";
import { InlineMessage } from "../components/InlineMessage";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionCard } from "../components/SectionCard";
import { SelectField } from "../components/SelectField";
import { TopHero } from "../components/TopHero";
import { caService } from "../services/caService";
import { pickUploadFile, saveExportFiles } from "../services/fileService";
import { theme } from "../theme";
import { formatDate } from "../utils/dateUtils";

const ALGORITHMS = ["RSA-2048", "RSA-4096", "EC-256", "EC-384"].map((a) => ({
  label: a,
  value: a,
}));

const createInitialForm = () => ({
  name: "",
  common_name: "",
  ca_type: "ROOT",
  organization: "",
  organizational_unit: "",
  country: "",
  state: "",
  locality: "",
  email_address: "",
  algorithm: "RSA-2048",
  parent_ca_id: "",
  validity_days: "365",
  selectedCertFile: null,
  selectedKeyFile: null,
});

export function CertificateAuthoritiesScreen({ reloadKey, onDataChanged }) {
  const [cas, setCas] = useState([]);
  const [casSummary, setCasSummary] = useState([]);
  const [chain, setChain] = useState([]);
  const [selectedCaId, setSelectedCaId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [rootForm, setRootForm] = useState(createInitialForm());
  const [intermediateForm, setIntermediateForm] = useState({
    ...createInitialForm(),
    ca_type: "INTERMEDIATE",
  });
  const [importForm, setImportForm] = useState({
    ...createInitialForm(),
    ca_type: "ROOT",
  });

  const notify = (title, text) => Alert.alert(title, text);

  const loadData = async () => {
    try {
      setError("");
      const [result, summary] = await Promise.all([
        caService.list(),
        caService.summary(),
      ]);
      setCas(result);
      setCasSummary(summary);
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
      setMessage("");
      await action();
      setMessage(successMessage);
      notify("Succes", successMessage);
      await loadData();
      onDataChanged();
    } catch (actionError) {
      setError(actionError.message);
      notify("Echec", actionError.message);
    }
  };

  const loadChain = async (caId) => {
    try {
      setSelectedCaId(caId);
      const result = await caService.getChain(caId);
      setChain(result.chain || []);
    } catch (chainError) {
      setError(chainError.message);
      notify("Echec", chainError.message);
    }
  };

  const parentCAOptions = casSummary.map((ca) => ({
    label: `[${ca.ca_id}] ${ca.name}`,
    value: String(ca.ca_id),
  }));

  return (
    <ScreenContainer>
      <TopHero
        title="Authorities"
        subtitle="Creation, import et chaine de confiance"
        meta="Gestion des CA"
      />
      <InlineMessage
        message={error || message}
        tone={error ? "danger" : message ? "success" : "info"}
      />

      <SectionCard title="Creer une Root CA">
        <FormField label="Nom" value={rootForm.name} onChangeText={(v) => setRootForm({ ...rootForm, name: v })} placeholder="Root CA - MonEntreprise" />
        <FormField label="Common Name" value={rootForm.common_name} onChangeText={(v) => setRootForm({ ...rootForm, common_name: v })} placeholder="Root CA - MonEntreprise" />
        <FormField label="Organisation" value={rootForm.organization} onChangeText={(v) => setRootForm({ ...rootForm, organization: v })} placeholder="MonEntreprise" />
        <FormField label="Unite" value={rootForm.organizational_unit} onChangeText={(v) => setRootForm({ ...rootForm, organizational_unit: v })} placeholder="Security" />
        <FormField label="Pays" value={rootForm.country} onChangeText={(v) => setRootForm({ ...rootForm, country: v })} placeholder="MG" />
        <FormField label="Etat / Region" value={rootForm.state} onChangeText={(v) => setRootForm({ ...rootForm, state: v })} placeholder="Analamanga" />
        <FormField label="Localite" value={rootForm.locality} onChangeText={(v) => setRootForm({ ...rootForm, locality: v })} placeholder="Antananarivo" />
        <FormField label="Email" value={rootForm.email_address} onChangeText={(v) => setRootForm({ ...rootForm, email_address: v })} placeholder="pki@entreprise.com" />
        <FormField label="Validite (jours)" value={rootForm.validity_days} onChangeText={(v) => setRootForm({ ...rootForm, validity_days: v })} placeholder="365" keyboardType="numeric" />
        <SelectField
          label="Algorithme"
          value={rootForm.algorithm}
          options={ALGORITHMS}
          onChange={(v) => setRootForm({ ...rootForm, algorithm: v })}
        />
        <PrimaryButton
          label="Creer la Root CA"
          onPress={() =>
            execute(
              () => caService.createRoot({
                ...rootForm,
                validity_days: rootForm.validity_days ? Number(rootForm.validity_days) : null,
              }),
              "Root CA creee avec succes.",
            )
          }
        />
      </SectionCard>

      <SectionCard title="Creer une CA intermediaire">
        <FormField label="Nom" value={intermediateForm.name} onChangeText={(v) => setIntermediateForm({ ...intermediateForm, name: v })} placeholder="Intermediate CA - Prod" />
        <FormField label="Common Name" value={intermediateForm.common_name} onChangeText={(v) => setIntermediateForm({ ...intermediateForm, common_name: v })} placeholder="Intermediate CA - Prod" />
        <SelectField
          label="CA Parente"
          value={intermediateForm.parent_ca_id}
          options={parentCAOptions}
          onChange={(v) => setIntermediateForm({ ...intermediateForm, parent_ca_id: v })}
          placeholder="-- Aucune --"
        />
        <FormField label="Validite (jours)" value={intermediateForm.validity_days} onChangeText={(v) => setIntermediateForm({ ...intermediateForm, validity_days: v })} placeholder="365" keyboardType="numeric" />
        <FormField label="Organisation" value={intermediateForm.organization} onChangeText={(v) => setIntermediateForm({ ...intermediateForm, organization: v })} placeholder="MonEntreprise" />
        <FormField label="Unite" value={intermediateForm.organizational_unit} onChangeText={(v) => setIntermediateForm({ ...intermediateForm, organizational_unit: v })} placeholder="Infra" />
        <FormField label="Pays" value={intermediateForm.country} onChangeText={(v) => setIntermediateForm({ ...intermediateForm, country: v })} placeholder="MG" />
        <FormField label="Etat / Region" value={intermediateForm.state} onChangeText={(v) => setIntermediateForm({ ...intermediateForm, state: v })} placeholder="Analamanga" />
        <FormField label="Localite" value={intermediateForm.locality} onChangeText={(v) => setIntermediateForm({ ...intermediateForm, locality: v })} placeholder="Antananarivo" />
        <FormField label="Email" value={intermediateForm.email_address} onChangeText={(v) => setIntermediateForm({ ...intermediateForm, email_address: v })} placeholder="infra@entreprise.com" />
        <SelectField
          label="Algorithme"
          value={intermediateForm.algorithm}
          options={ALGORITHMS}
          onChange={(v) => setIntermediateForm({ ...intermediateForm, algorithm: v })}
        />
        <PrimaryButton
          label="Creer la CA intermediaire"
          onPress={() =>
            execute(
              () => caService.createIntermediate({
                ...intermediateForm,
                parent_ca_id: intermediateForm.parent_ca_id ? Number(intermediateForm.parent_ca_id) : null,
                validity_days: intermediateForm.validity_days ? Number(intermediateForm.validity_days) : null,
              }),
              "CA intermediaire créée avec succes.",
            )
          }
        />
      </SectionCard>

      <SectionCard title="Importer une CA">
        <FormField label="Nom" value={importForm.name} onChangeText={(v) => setImportForm({ ...importForm, name: v })} placeholder="Imported CA" />
        <FormField label="Type" value={importForm.ca_type} onChangeText={(v) => setImportForm({ ...importForm, ca_type: v })} placeholder="ROOT ou INTERMEDIATE" />
        <SelectField
          label="CA Parente"
          value={importForm.parent_ca_id}
          options={parentCAOptions}
          onChange={(v) => setImportForm({ ...importForm, parent_ca_id: v })}
          placeholder="-- Aucune --"
        />
        <PrimaryButton compact tone="ghost" label={importForm.selectedCertFile?.name || "Choisir certificat .crt / .pem"}
          onPress={async () => {
            const f = await pickUploadFile();
            if (f) setImportForm({ ...importForm, selectedCertFile: f });
          }}
        />
        <PrimaryButton compact tone="ghost" label={importForm.selectedKeyFile?.name || "Choisir cle privee"}
          onPress={async () => {
            const f = await pickUploadFile();
            if (f) setImportForm({ ...importForm, selectedKeyFile: f });
          }}
        />
        <PrimaryButton
          label="Importer la CA"
          onPress={() =>
            execute(
              () => caService.importOne({
                name: importForm.name,
                ca_type: importForm.ca_type,
                parent_ca_id: importForm.parent_ca_id ? Number(importForm.parent_ca_id) : null,
                certificateFile: importForm.selectedCertFile,
                privateKeyFile: importForm.selectedKeyFile,
              }),
              "CA importee avec succes.",
            )
          }
        />
      </SectionCard>

      <SectionCard title="Authorities enregistrees" subtitle="Tape pour charger la chaine de confiance">
        {cas.map((item) => (
          <EntityRow
            key={item.ca_id}
            title={item.name}
            subtitle={`ID: ${item.ca_id} - ${item.ca_type || "CA"} - expire le ${formatDate(item.expires_at)}`}
            meta={`CA #${item.ca_id}`}
            badgeLabel={item.status}
            badgeTone={item.ca_type === "ROOT" ? "accent" : "info"}
            onPress={() => loadChain(item.ca_id)}
            actions={
              <View style={styles.actions}>
                <PrimaryButton compact tone="ghost" label="Exporter"
                  onPress={() =>
                    execute(async () => {
                      const exported = await caService.exportOne(item.ca_id);
                      await saveExportFiles(exported.files);
                    }, `Export PEM de ${item.name} prepare.`)
                  }
                />
                <PrimaryButton compact tone="danger" label="Supprimer"
                  onPress={() => execute(() => caService.remove(item.ca_id), `${item.name} supprimee.`)}
                />
              </View>
            }
          />
        ))}
      </SectionCard>

      <SectionCard
        title="Chaine de confiance"
        subtitle={selectedCaId ? `CA selectionnee: ${selectedCaId}` : "Selectionne une CA pour visualiser sa chaine"}
      >
        {chain.length ? (
          chain.map((item, index) => (
            <View key={`${item.ca_id}-${index}`} style={styles.chainNode}>
              <Text style={styles.chainTitle}>{item.name}</Text>
              <Text style={styles.chainMeta}>{item.ca_type} - statut {item.status}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>La chaine apparaitra ici apres selection.</Text>
        )}
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 8 },
  chainNode: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  chainTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  chainMeta: { color: theme.colors.textMuted },
  empty: { color: theme.colors.textMuted },
});