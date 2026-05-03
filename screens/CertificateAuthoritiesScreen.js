import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { EntityRow } from "../components/EntityRow";
import { FormField } from "../components/FormField";
import { InlineMessage } from "../components/InlineMessage";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionCard } from "../components/SectionCard";
import { TopHero } from "../components/TopHero";
import { caService } from "../services/caService";
import { pickUploadFile, saveExportFiles } from "../services/fileService";
import { theme } from "../theme";
import { formatDate } from "../utils/dateUtils";

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
      const result = await caService.list();
      setCas(result);
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
        <FormField
          label="Nom"
          value={rootForm.name}
          onChangeText={(value) => setRootForm({ ...rootForm, name: value })}
          placeholder="Root CA - MonEntreprise"
        />
        <FormField
          label="Common Name"
          value={rootForm.common_name}
          onChangeText={(value) =>
            setRootForm({ ...rootForm, common_name: value })
          }
          placeholder="Root CA - MonEntreprise"
        />
        <FormField
          label="Organisation"
          value={rootForm.organization}
          onChangeText={(value) =>
            setRootForm({ ...rootForm, organization: value })
          }
          placeholder="MonEntreprise"
        />
        <FormField
          label="Unite"
          value={rootForm.organizational_unit}
          onChangeText={(value) =>
            setRootForm({ ...rootForm, organizational_unit: value })
          }
          placeholder="Security"
        />
        <FormField
          label="Pays"
          value={rootForm.country}
          onChangeText={(value) => setRootForm({ ...rootForm, country: value })}
          placeholder="MG"
        />
        <FormField
          label="Etat / Region"
          value={rootForm.state}
          onChangeText={(value) => setRootForm({ ...rootForm, state: value })}
          placeholder="Analamanga"
        />
        <FormField
          label="Localite"
          value={rootForm.locality}
          onChangeText={(value) =>
            setRootForm({ ...rootForm, locality: value })
          }
          placeholder="Antananarivo"
        />
        <FormField
          label="Email"
          value={rootForm.email_address}
          onChangeText={(value) =>
            setRootForm({ ...rootForm, email_address: value })
          }
          placeholder="pki@entreprise.com"
        />
        <FormField
          label="Validite (jours)"
          value={rootForm.validity_days}
          onChangeText={(value) =>
            setRootForm({ ...rootForm, validity_days: value })
          }
          placeholder="365"
          keyboardType="numeric"
        />
        <FormField
          label="Algorithme"
          value={rootForm.algorithm}
          onChangeText={(value) =>
            setRootForm({ ...rootForm, algorithm: value })
          }
          placeholder="RSA-2048"
        />
        <PrimaryButton
          label="Creer la Root CA"
          onPress={() =>
            execute(
              () =>
                caService.createRoot({
                  ...rootForm,
                  validity_days: rootForm.validity_days
                    ? Number(rootForm.validity_days)
                    : null,
                }),
              "Root CA creee avec succes.",
            )
          }
        />
      </SectionCard>

      <SectionCard title="Creer une CA intermediaire">
        <FormField
          label="Nom"
          value={intermediateForm.name}
          onChangeText={(value) =>
            setIntermediateForm({ ...intermediateForm, name: value })
          }
          placeholder="Intermediate CA - Prod"
        />
        <FormField
          label="Common Name"
          value={intermediateForm.common_name}
          onChangeText={(value) =>
            setIntermediateForm({ ...intermediateForm, common_name: value })
          }
          placeholder="Intermediate CA - Prod"
        />
        <FormField
          label="CA parente (ID)"
          value={intermediateForm.parent_ca_id}
          onChangeText={(value) =>
            setIntermediateForm({ ...intermediateForm, parent_ca_id: value })
          }
          placeholder="1"
          keyboardType="numeric"
        />
        <FormField
          label="Validite (jours)"
          value={intermediateForm.validity_days}
          onChangeText={(value) =>
            setIntermediateForm({ ...intermediateForm, validity_days: value })
          }
          placeholder="365"
          keyboardType="numeric"
        />
        <FormField
          label="Organisation"
          value={intermediateForm.organization}
          onChangeText={(value) =>
            setIntermediateForm({ ...intermediateForm, organization: value })
          }
          placeholder="MonEntreprise"
        />
        <FormField
          label="Unite"
          value={intermediateForm.organizational_unit}
          onChangeText={(value) =>
            setIntermediateForm({
              ...intermediateForm,
              organizational_unit: value,
            })
          }
          placeholder="Infra"
        />
        <FormField
          label="Pays"
          value={intermediateForm.country}
          onChangeText={(value) =>
            setIntermediateForm({ ...intermediateForm, country: value })
          }
          placeholder="MG"
        />
        <FormField
          label="Etat / Region"
          value={intermediateForm.state}
          onChangeText={(value) =>
            setIntermediateForm({ ...intermediateForm, state: value })
          }
          placeholder="Analamanga"
        />
        <FormField
          label="Localite"
          value={intermediateForm.locality}
          onChangeText={(value) =>
            setIntermediateForm({ ...intermediateForm, locality: value })
          }
          placeholder="Antananarivo"
        />
        <FormField
          label="Email"
          value={intermediateForm.email_address}
          onChangeText={(value) =>
            setIntermediateForm({ ...intermediateForm, email_address: value })
          }
          placeholder="infra@entreprise.com"
        />
        <FormField
          label="Algorithme"
          value={intermediateForm.algorithm}
          onChangeText={(value) =>
            setIntermediateForm({ ...intermediateForm, algorithm: value })
          }
          placeholder="RSA-2048"
        />
        <PrimaryButton
          label="Creer la CA intermediaire"
          onPress={() =>
            execute(
              () =>
                caService.createIntermediate({
                  ...intermediateForm,
                  parent_ca_id: intermediateForm.parent_ca_id
                    ? Number(intermediateForm.parent_ca_id)
                    : null,
                  validity_days: intermediateForm.validity_days
                    ? Number(intermediateForm.validity_days)
                    : null,
                }),
              "CA intermediaire créée avec succes.",
            )
          }
        />
      </SectionCard>

      <SectionCard title="Importer une CA">
        <FormField
          label="Nom"
          value={importForm.name}
          onChangeText={(value) =>
            setImportForm({ ...importForm, name: value })
          }
          placeholder="Imported CA"
        />
        <FormField
          label="Type"
          value={importForm.ca_type}
          onChangeText={(value) =>
            setImportForm({ ...importForm, ca_type: value })
          }
          placeholder="ROOT ou INTERMEDIATE"
        />
        <FormField
          label="CA parente (ID)"
          value={importForm.parent_ca_id}
          onChangeText={(value) =>
            setImportForm({ ...importForm, parent_ca_id: value })
          }
          placeholder="Optionnel"
          keyboardType="numeric"
        />
        <PrimaryButton
          compact
          tone="ghost"
          label={
            importForm.selectedCertFile?.name ||
            "Choisir certificat .crt / .pem"
          }
          onPress={async () => {
            const selectedFile = await pickUploadFile();
            if (selectedFile) {
              setImportForm({ ...importForm, selectedCertFile: selectedFile });
            }
          }}
        />
        <PrimaryButton
          compact
          tone="ghost"
          label={importForm.selectedKeyFile?.name || "Choisir cle privee"}
          onPress={async () => {
            const selectedFile = await pickUploadFile();
            if (selectedFile) {
              setImportForm({ ...importForm, selectedKeyFile: selectedFile });
            }
          }}
        />
        <PrimaryButton
          label="Importer la CA"
          onPress={() =>
            execute(
              () =>
                caService.importOne({
                  name: importForm.name,
                  ca_type: importForm.ca_type,
                  parent_ca_id: importForm.parent_ca_id
                    ? Number(importForm.parent_ca_id)
                    : null,
                  certificateFile: importForm.selectedCertFile,
                  privateKeyFile: importForm.selectedKeyFile,
                }),
              "CA importee avec succes.",
            )
          }
        />
      </SectionCard>

      <SectionCard
        title="Authorities enregistrees"
        subtitle="Tape pour charger la chaine de confiance"
      >
        {cas.map((item) => (
          <EntityRow
            key={item.ca_id}
            title={item.name}
            subtitle={`${item.ca_type || "CA"} - expire le ${formatDate(item.expires_at)}`}
            meta={`ID ${item.ca_id}`}
            badgeLabel={item.status}
            badgeTone={item.ca_type === "ROOT" ? "accent" : "info"}
            onPress={() => loadChain(item.ca_id)}
            actions={
              <View style={styles.actions}>
                <PrimaryButton
                  compact
                  tone="ghost"
                  label="Exporter"
                  onPress={() =>
                    execute(async () => {
                      const exported = await caService.exportOne(item.ca_id);
                      await saveExportFiles(exported.files);
                    }, `Export PEM de ${item.name} prepare.`)
                  }
                />
                <PrimaryButton
                  compact
                  tone="danger"
                  label="Supprimer"
                  onPress={() =>
                    execute(
                      () => caService.remove(item.ca_id),
                      `${item.name} supprimee.`,
                    )
                  }
                />
              </View>
            }
          />
        ))}
      </SectionCard>

      <SectionCard
        title="Chaine de confiance"
        subtitle={
          selectedCaId
            ? `CA selectionnee: ${selectedCaId}`
            : "Selectionne une CA pour visualiser sa chaine"
        }
      >
        {chain.length ? (
          chain.map((item, index) => (
            <View key={`${item.ca_id}-${index}`} style={styles.chainNode}>
              <Text style={styles.chainTitle}>{item.name}</Text>
              <Text style={styles.chainMeta}>
                {item.ca_type} - statut {item.status}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>
            La chaine apparaitra ici apres selection.
          </Text>
        )}
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 8,
  },
  chainNode: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  chainTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  chainMeta: {
    color: theme.colors.textMuted,
  },
  empty: {
    color: theme.colors.textMuted,
  },
});
