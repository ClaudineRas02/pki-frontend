import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EntityRow } from '../components/EntityRow';
import { InlineMessage } from '../components/InlineMessage';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { StatCard } from '../components/StatCard';
import { TopHero } from '../components/TopHero';
import { caService } from '../services/caService';
import { certificateService } from '../services/certificateService';
import { theme } from '../theme';
import { formatDate, getDaysUntil, getExpiryBand } from '../utils/dateUtils';

const getToneFromBand = (band) => {
  if (band === 'critical' || band === 'expired') {
    return 'danger';
  }

  if (band === 'warning' || band === 'watch') {
    return 'warning';
  }

  return 'success';
};

export function DashboardScreen({ reloadKey }) {
  const [summary, setSummary] = useState({
    certificates: [],
    cas: [],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const [certificates, cas] = await Promise.all([
          certificateService.list(),
          caService.list(),
        ]);
        setSummary({ certificates, cas });
      } catch (loadError) {
        setError(loadError.message);
      }
    };

    load();
  }, [reloadKey]);

  const activeCertificates = summary.certificates.filter((item) => item.status === 'VALID');
  const expiringSoon = summary.certificates.filter((item) => {
    const days = getDaysUntil(item.expires_at);
    return days !== null && days >= 0 && days <= 30;
  });
  const rootCas = summary.cas.filter((item) => item.ca_type === 'ROOT');
  const revoked = summary.certificates.filter((item) => item.status === 'REVOKED');
  const recentItems = [
    ...summary.certificates.map((item) => ({ ...item, entityType: 'CERT' })),
    ...summary.cas.map((item) => ({ ...item, entityType: 'CA' })),
  ]
    .sort((a, b) => new Date(b.created_at || b.issued_at) - new Date(a.created_at || a.issued_at))
    .slice(0, 6);

  const notifications = summary.certificates
    .map((item) => ({
      ...item,
      daysUntil: getDaysUntil(item.expires_at),
    }))
    .filter((item) => item.daysUntil !== null && [7, 30, 90].includes(item.daysUntil))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <ScreenContainer>
      <TopHero
        title="CertManager"
        subtitle={`${activeCertificates.length} certificats actifs`}
        meta="Supervision PKI mobile"
      />

      <InlineMessage
        message={error || 'Pense a ajuster frontend/services/apiConfig.js si l’API backend tourne sur une autre IP.'}
        tone={error ? 'danger' : 'info'}
      />

      <View style={styles.grid}>
        <StatCard value={activeCertificates.length} label="Actifs" tint={theme.colors.primary} />
        <StatCard value={expiringSoon.length} label="Expirent bientot" tint={theme.colors.warning} />
        <StatCard value={rootCas.length} label="CA racines" tint={theme.colors.accent} />
        <StatCard value={revoked.length} label="Revoques" tint={theme.colors.danger} />
      </View>

      <SectionCard title="Alertes expiration" subtitle="Seuils 7 jours, 30 jours et 90 jours">
        {notifications.length ? (
          notifications.map((item) => (
            <EntityRow
              key={`notification-${item.cert_id}`}
              title={item.common_name}
              subtitle={`Expire le ${formatDate(item.expires_at)}`}
              meta={`Alerte a ${item.daysUntil} jour${item.daysUntil > 1 ? 's' : ''}`}
              badgeLabel={`${item.daysUntil}j`}
              badgeTone={getToneFromBand(getExpiryBand(item.daysUntil))}
            />
          ))
        ) : (
          <Text style={styles.empty}>Aucune notification a afficher pour les seuils actifs.</Text>
        )}
      </SectionCard>

      <SectionCard title="Elements recents" subtitle="Certificats et authorities les plus recentes">
        {recentItems.map((item) => {
          const isCertificate = item.entityType === 'CERT';
          const daysUntil = getDaysUntil(isCertificate ? item.expires_at : item.expires_at);
          const badgeTone = isCertificate
            ? getToneFromBand(getExpiryBand(daysUntil))
            : item.ca_type === 'ROOT'
              ? 'accent'
              : 'info';

          return (
            <EntityRow
              key={`${item.entityType}-${isCertificate ? item.cert_id : item.ca_id}`}
              title={isCertificate ? item.common_name : item.name}
              subtitle={
                isCertificate
                  ? `${item.cert_type || 'CERT'} - ${item.algorithm || 'N/A'}`
                  : `${item.ca_type || 'CA'}`
              }
              meta={
                isCertificate
                  ? `Expire le ${formatDate(item.expires_at)}`
                  : `Creee le ${formatDate(item.created_at)}`
              }
              badgeLabel={isCertificate ? item.status : item.ca_type}
              badgeTone={badgeTone}
            />
          );
        })}
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  empty: {
    color: theme.colors.textMuted,
    fontSize: 15,
  },
});
