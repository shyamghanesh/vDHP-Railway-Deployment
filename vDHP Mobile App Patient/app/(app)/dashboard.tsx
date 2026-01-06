import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SimpleLineChart } from '@/components/ui/SimpleLineChart';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { patientService, vitalsService } from '@/services/api';


export default function DashboardScreen() {
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bpVitals, setBpVitals] = useState<any[]>([]);
  const [sugarVitals, setSugarVitals] = useState<any[]>([]);
  const [latestVitals, setLatestVitals] = useState<any>({});
  const [storedName, setStoredName] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const patientId = await AsyncStorage.getItem('patient_id');
      const name = await AsyncStorage.getItem('patient_name');
      setStoredName(name);

      // We don't strictly need patientId as the backend uses the token
      // But we pass it to satisfy the service signatures
      const idToUse = patientId || '';

      const [patientData, tasksData, bpData, sugarData, latestData] = await Promise.all([
        patientService.getProfile(idToUse),
        patientService.getTasks(idToUse, 'pending', 1),
        vitalsService.getVitals('blood_pressure', 30),
        vitalsService.getVitals('blood_sugar', 30),
        vitalsService.getLatestVitals(),
      ]);
      setPatient(patientData);
      setTasks(tasksData.slice(0, 3));
      setBpVitals(bpData.vitals || []);
      setSugarVitals(sugarData.vitals || []);
      setLatestVitals(latestData || {});
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = (vitals: any[], type: 'bp' | 'sugar') => {
    if (vitals.length === 0) {
      return {
        labels: ['No data'],
        datasets: [{ data: [0] }],
      };
    }

    // Sort by date and take last 7 readings
    const sorted = [...vitals].sort((a, b) =>
      new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
    ).slice(-7);

    const labels = sorted.map(v => {
      const date = new Date(v.measured_at);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    if (type === 'bp') {
      // For BP, show systolic values
      const data = sorted.map(v => v.systolic || 0);
      return { labels, datasets: [{ data }] };
    } else {
      // For sugar, show blood sugar values
      const data = sorted.map(v => v.blood_sugar_value || 0);
      return { labels, datasets: [{ data }] };
    }
  };


  return (
    <LinearGradient
      colors={[Colors.dark.background, Colors.dark.backgroundElevated]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerTop}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.appLogo}
              resizeMode="contain"
            />
            <Image
              source={require('@/assets/images/virtusa-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.header}>
            <Text style={styles.greeting}>Hello, {patient?.first_name || storedName || 'there'}!</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</Text>
          </View>

          <Card style={styles.quickActionsCard} elevated>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/(app)/tasks')}
              >
                <Text style={styles.actionIcon}>✓</Text>
                <Text style={styles.actionText}>My Tasks</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/(app)/messages')}
              >
                <Text style={styles.actionIcon}>💬</Text>
                <Text style={styles.actionText}>Messages</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/(app)/profile')}
              >
                <Text style={styles.actionIcon}>👤</Text>
                <Text style={styles.actionText}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/(app)/vitals')}
              >
                <Text style={styles.actionIcon}>📊</Text>
                <Text style={styles.actionText}>Record Vitals</Text>
              </TouchableOpacity>
            </View>
          </Card>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <Card key={task.id} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <View style={[styles.priorityBadge,
                    task.priority === 'high' && styles.priorityHigh,
                    task.priority === 'medium' && styles.priorityMedium
                    ]}>
                      <Text style={styles.priorityText}>{task.priority}</Text>
                    </View>
                  </View>
                  {task.description && (
                    <Text style={styles.taskDescription}>{task.description}</Text>
                  )}
                  {task.due_date && (
                    <Text style={styles.taskDue}>
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </Text>
                  )}
                </Card>
              ))
            ) : (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>No pending tasks. Great job! 🎉</Text>
              </Card>
            )}
          </View>

          <Card style={styles.healthSummaryCard} elevated>
            <Text style={styles.cardTitle}>Health Summary</Text>
            <View style={styles.healthStats}>
              <View style={styles.healthStat}>
                <Text style={styles.healthStatValue}>
                  {latestVitals.blood_pressure
                    ? `${latestVitals.blood_pressure.systolic}/${latestVitals.blood_pressure.diastolic}`
                    : '--'}
                </Text>
                <Text style={styles.healthStatLabel}>Blood Pressure</Text>
              </View>
              <View style={styles.healthStat}>
                <Text style={styles.healthStatValue}>
                  {latestVitals.blood_sugar
                    ? `${latestVitals.blood_sugar.blood_sugar_value} ${latestVitals.blood_sugar.blood_sugar_unit || 'mg/dL'}`
                    : '--'}
                </Text>
                <Text style={styles.healthStatLabel}>Blood Sugar</Text>
              </View>
              <View style={styles.healthStat}>
                <Text style={styles.healthStatValue}>
                  {latestVitals.heart_rate
                    ? `${latestVitals.heart_rate.value} ${latestVitals.heart_rate.unit || 'bpm'}`
                    : '--'}
                </Text>
                <Text style={styles.healthStatLabel}>Heart Rate</Text>
              </View>
            </View>
          </Card>

          {bpVitals.length > 0 && (
            <Card style={styles.chartCard} elevated>
              <Text style={styles.cardTitle}>Blood Pressure Trend</Text>
              <Text style={styles.chartSubtitle}>Last 7 readings (mmHg)</Text>
              <SimpleLineChart
                data={formatChartData(bpVitals, 'bp').datasets[0].data}
                labels={formatChartData(bpVitals, 'bp').labels}
                height={220}
                color={Colors.dark.primary}
                unit="mmHg"
              />
            </Card>
          )}

          {sugarVitals.length > 0 && (
            <Card style={styles.chartCard} elevated>
              <Text style={styles.cardTitle}>Blood Sugar Trend</Text>
              <Text style={styles.chartSubtitle}>Last 7 readings ({sugarVitals[0]?.blood_sugar_unit || 'mg/dL'})</Text>
              <SimpleLineChart
                data={formatChartData(sugarVitals, 'sugar').datasets[0].data}
                labels={formatChartData(sugarVitals, 'sugar').labels}
                height={220}
                color={Colors.dark.primary}
                unit={sugarVitals[0]?.blood_sugar_unit || 'mg/dL'}
              />
            </Card>
          )}

          {bpVitals.length === 0 && sugarVitals.length === 0 && (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No vitals data yet. Start tracking your health metrics!</Text>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 16,
    gap: 16,
  },
  appLogo: {
    width: 50,
    height: 50,
  },
  logo: {
    width: 150,
    height: 50,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: Typography.fontSizes.xxxl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.dark.text,
  },
  date: {
    fontSize: Typography.fontSizes.lg,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  quickActionsCard: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.dark.text,
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: Typography.fontSizes.base,
    color: Colors.dark.text,
    fontWeight: Typography.fontWeights.medium,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.dark.text,
    marginBottom: 12,
  },
  taskCard: {
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.dark.text,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
  },
  priorityHigh: {
    backgroundColor: Colors.dark.error + '30',
  },
  priorityMedium: {
    backgroundColor: Colors.dark.warning + '30',
  },
  priorityText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.dark.text,
    textTransform: 'capitalize',
  },
  taskDescription: {
    fontSize: Typography.fontSizes.base,
    color: Colors.dark.textSecondary,
    marginBottom: 8,
  },
  taskDue: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.dark.primary,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: Typography.fontSizes.lg,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  healthSummaryCard: {
    marginBottom: 24,
  },
  healthStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  healthStat: {
    alignItems: 'center',
  },
  healthStatValue: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.dark.primary,
    marginBottom: 4,
  },
  healthStatLabel: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.dark.textSecondary,
  },
  healthNote: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.dark.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  chartCard: {
    marginBottom: 24,
  },
  chartSubtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.dark.textSecondary,
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
