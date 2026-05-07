import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { EntityRow } from "../components/EntityRow";
import { FormField } from "../components/FormField";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionCard } from "../components/SectionCard";
import { TopHero } from "../components/TopHero";
import { artifactService } from "../services/artifactService";
import { caService } from "../services/caService";
import { certificateService } from "../services/certificateService";
import { csrService } from "../services/csrService";
import {
  pickFile,
  pickUploadFile,
  saveExportFiles,
} from "../services/fileService";
import { theme } from "../theme";
import { formatDate } from "../utils/dateUtils";

const initialImportForm = {
  type: "CSR",
  name: "",
  ca_type: "ROOT",
  cert_type: "SERVER",
  ca_id: "",
  selectedFile: null,
  selectedKeyFile: null,
};

export function ArtifactsScreen({ reloadKey, onDataChanged }) {
  const [artifacts, setArtifacts] = useState([]);
  const [error, setError] = useState("");
  const [importForm, setImportForm] = useState(initialImportForm);

  const notify = (title, message) => Alert.alert(title, message);

  const loadArtifacts = async () => {
    try {
      setError("");
      const result = await artifactService.list();
      setArtifacts(result);
    } catch (loadError) {
      setError(loadError.message);
      notify("Echec", loadError.message);
    }
  };

  useEffect(() => {
    loadArtifacts();
  }, [reloadKey]);

  const execute = async (action, successMessage) => {
    try {
      setError("");
      await action();
      notify("Succes", successMessage);
      await loadArtifacts();
      onDataChanged?.();
    } catch (actionError) {
      setError(actionError.message);
      notify("Echec", actionError.message);
    }
  };

  const exportArtifact = (item) =>
    execute(async () => {
      const exported =
        item.type === "CA"
          ? await caService.exportOne(item.id, "pem")
          : item.type === "CSR"
            ? await csrService.exportOne(item.id)
            : await certificateService.exportOne(item.id, "pem");
      await saveExportFiles(exported.files);
    }, `Export de ${item.name} prepare.`);

  const importArtifact = () =>
    execute(async () => {
      if (importForm.type === "CA") {
        await caService.importOne({
          name: importForm.name,
          ca_type: importForm.ca_type,
          certificateFile: importForm.selectedFile,
          privateKeyFile: importForm.selectedKeyFile,
        });
        return;
      }

      if (importForm.type === "CRT") {
        await certificateService.importOne({
          common_name: importForm.name,
          cert_type: importForm.cert_type,
          ca_id: importForm.ca_id ? Number(importForm.ca_id) : null,
          file_format: importForm.selectedFile?.extension || "pem",
          certificate_base64: importForm.selectedFile?.base64,
          private_key_base64: importForm.selectedKeyFile?.base64,
        });
        return;
      }

      await csrService.importOne({
        common_name: importForm.name,
        csr_base64: importForm.selectedFile?.base64,
      });
    }, `${importForm.type} importe et ajoute a la liste.`);

  return (
    <ScreenContainer>
      <TopHero
        title="Artefacts PKI"
        subtitle="CA, CSR et CRT generes ou importes"
        meta="Gestionnaire de fichiers"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <SectionCard title="Importer un artefact">
        <View style={styles.typeRow}>
          {["CA", "CSR", "CRT"].map((type) => (
            <PrimaryButton
              key={type}
              compact
              tone={importForm.type === type ? "soft" : "ghost"}
              label={type}
              onPress={() => setImportForm({ ...importForm, type })}
            />
          ))}
        </View>
        <FormField
          label="Nom / Common Name"
          value={importForm.name}
          onChangeText={(value) =>
            setImportForm({ ...importForm, name: value })
          }
          placeholder="api.mondomaine.com"
        />
        {importForm.type === "CA" ? (
          <FormField
            label="Type CA"
            value={importForm.ca_type}
            onChangeText={(value) =>
              setImportForm({ ...importForm, ca_type: value })
            }
            placeholder="ROOT ou INTERMEDIATE"
          />
        ) : null}
        {importForm.type === "CRT" ? (
          <>
            <FormField
              label="Type CRT"
              value={importForm.cert_type}
              onChangeText={(value) =>
                setImportForm({ ...importForm, cert_type: value })
              }
              placeholder="SERVER"
            />
            <FormField
              label="CA ID"
              value={importForm.ca_id}
              onChangeText={(value) =>
                setImportForm({ ...importForm, ca_id: value })
              }
              placeholder="Optionnel"
              keyboardType="numeric"
            />
          </>
        ) : null}
        <PrimaryButton
          compact
          tone="ghost"
          label={
            importForm.selectedFile?.name ||
            (importForm.type === "CA"
              ? "Choisir certificat .crt / .pem"
              : "Choisir le fichier")
          }
          onPress={async () => {
            const selectedFile =
              importForm.type === "CA"
                ? await pickUploadFile()
                : await pickFile();
            if (selectedFile) {
              setImportForm({ ...importForm, selectedFile });
            }
          }}
        />
        {importForm.type !== "CSR" ? (
          <PrimaryButton
            compact
            tone="ghost"
            label={importForm.selectedKeyFile?.name || "Choisir la cle privee"}
            onPress={async () => {
              const selectedKeyFile =
                importForm.type === "CA"
                  ? await pickUploadFile()
                  : await pickFile();
              if (selectedKeyFile) {
                setImportForm({ ...importForm, selectedKeyFile });
              }
            }}
          />
        ) : null}
        <PrimaryButton
          label="Importer et ajouter a la liste"
          onPress={importArtifact}
        />
      </SectionCard>

      <SectionCard title="Liste unifiee">
        {artifacts.length ? (
          artifacts.map((item) => (
            <EntityRow
              key={item.artifact_id}
              title={item.name}
              subtitle={`ID: ${item.id} - ${item.type} - fichier ${Object.values(item.file_paths || {}).some(Boolean) ? "present" : "absent"}`}
              meta={`Cree le ${formatDate(item.created_at)}${item.expires_at ? ` - expire le ${formatDate(item.expires_at)}` : ""}`}
              badgeLabel={item.status || item.type}
              badgeTone={
                item.type === "CA"
                  ? "accent"
                  : item.type === "CSR"
                    ? "info"
                    : "success"
              }
              actions={
                <PrimaryButton
                  compact
                  tone="ghost"
                  label="Exporter"
                  onPress={() => exportArtifact(item)}
                />
              }
            />
          ))
        ) : (
          <Text style={styles.helper}>
            Aucun artefact genere ou importe pour le moment.
          </Text>
        )}
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  typeRow: {
    flexDirection: "row",
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
    fontWeight: "700",
  },
});
