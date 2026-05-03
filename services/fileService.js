import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { API_BASE_URL } from './apiConfig';

const getFileExtension = (name) => {
  const parts = String(name || '').split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const readAssetAsBase64 = async (asset) => {
  if (asset.base64) {
    return asset.base64;
  }

  if (Platform.OS === 'web') {
    if (asset.file) {
      return blobToBase64(asset.file);
    }

    const response = await fetch(asset.uri);
    const blob = await response.blob();
    return blobToBase64(blob);
  }

  return FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
};

export const pickFile = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  const base64 = await readAssetAsBase64(asset);

  return {
    name: asset.name,
    uri: asset.uri,
    mimeType: asset.mimeType,
    base64,
    extension: getFileExtension(asset.name),
  };
};

export const pickUploadFile = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];

  return {
    name: asset.name,
    uri: asset.uri,
    mimeType: asset.mimeType || 'application/octet-stream',
    extension: getFileExtension(asset.name),
    file: asset.file,
  };
};

export const appendUploadFile = (formData, fieldName, selectedFile) => {
  if (!selectedFile) {
    return;
  }

  if (Platform.OS === 'web' && selectedFile.file) {
    formData.append(fieldName, selectedFile.file, selectedFile.name);
    return;
  }

  formData.append(fieldName, {
    uri: selectedFile.uri,
    name: selectedFile.name,
    type: selectedFile.mimeType || 'application/octet-stream',
  });
};

export const saveExportFiles = async (files) => {
  if (!files?.length) {
    return [];
  }

  const savedFiles = [];
  const shareableFiles = [];

  for (const file of files) {
    if (file.download_path) {
      const downloadUrl = `${API_BASE_URL}${file.download_path}`;

      if (Platform.OS === 'web') {
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(`Export impossible pour ${file.filename}.`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = file.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(objectUrl);
        savedFiles.push(file.filename);
        continue;
      }

      const targetPath = `${FileSystem.cacheDirectory}${file.filename}`;
      const downloaded = await FileSystem.downloadAsync(downloadUrl, targetPath);
      savedFiles.push(downloaded.uri);
      shareableFiles.push(downloaded.uri);
      continue;
    }

    const targetPath = `${FileSystem.cacheDirectory}${file.filename}`;
    await FileSystem.writeAsStringAsync(targetPath, file.content_base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    savedFiles.push(targetPath);
    shareableFiles.push(targetPath);
  }

  if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
    for (const fileUri of shareableFiles) {
      await Sharing.shareAsync(fileUri);
    }
  }

  return savedFiles;
};
