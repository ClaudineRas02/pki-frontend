import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DashboardScreen } from '../screens/DashboardScreen';
import { CertificateAuthoritiesScreen } from '../screens/CertificateAuthoritiesScreen';
import { CertificatesScreen } from '../screens/CertificatesScreen';
import { CsrScreen } from '../screens/CsrScreen';
import { ArtifactsScreen } from '../screens/ArtifactsScreen';
import { theme } from '../theme';

const tabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'cas', label: 'CA' },
  { key: 'csr', label: 'CSR' },
  { key: 'certs', label: 'CRT' },
  { key: 'artifacts', label: 'Artefacts' },
];

export function AppNavigator() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reloadKey, setReloadKey] = useState(0);

  const triggerRefresh = () => {
    setReloadKey((value) => value + 1);
  };

  useEffect(() => {
    triggerRefresh();
  }, [activeTab]);

  let screen = <DashboardScreen reloadKey={reloadKey} onDataChanged={triggerRefresh} />;

  if (activeTab === 'cas') {
    screen = <CertificateAuthoritiesScreen reloadKey={reloadKey} onDataChanged={triggerRefresh} />;
  }

  if (activeTab === 'certs') {
    screen = <CertificatesScreen reloadKey={reloadKey} onDataChanged={triggerRefresh} />;
  }

  if (activeTab === 'csr') {
    screen = <CsrScreen reloadKey={reloadKey} onDataChanged={triggerRefresh} />;
  }

  if (activeTab === 'artifacts') {
    screen = <ArtifactsScreen reloadKey={reloadKey} onDataChanged={triggerRefresh} />;
  }

  return (
    <View style={styles.layout}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.screen}>{screen}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    gap: 8,
    backgroundColor: '#06111f',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  tabActive: {
    backgroundColor: theme.colors.panelSoft,
  },
  tabLabel: {
    color: theme.colors.textDim,
    fontWeight: '700',
    fontSize: 13,
  },
  tabLabelActive: {
    color: theme.colors.text,
  },
  screen: {
    flex: 1,
  },
});
