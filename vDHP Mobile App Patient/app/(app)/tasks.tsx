import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { GradientButton } from '@/components/ui/GradientButton';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { carePlanService } from '@/services/api';

export default function TasksScreen() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadTasks();
  }, [page]);

  const loadTasks = async () => {
    try {
      const patientId = await AsyncStorage.getItem('patient_id');
      if (patientId) {
        const data = await carePlanService.getTasks(patientId, undefined, page);
        setTasks(page === 1 ? data : [...tasks, ...data]);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const patientId = await AsyncStorage.getItem('patient_id');
      if (patientId) {
        await carePlanService.completeTask(taskId, patientId);
        setTasks(tasks.filter(t => t.id !== taskId));
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const renderTask = ({ item }: { item: any }) => (
    <Card style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <View style={styles.taskMeta}>
            <View style={[styles.statusBadge, 
              item.status === 'pending' && styles.statusPending,
              item.status === 'in_progress' && styles.statusInProgress,
              item.status === 'completed' && styles.statusCompleted
            ]}>
              <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
            </View>
            <View style={[styles.priorityBadge,
              item.priority === 'high' && styles.priorityHigh,
              item.priority === 'medium' && styles.priorityMedium
            ]}>
              <Text style={styles.priorityText}>{item.priority}</Text>
            </View>
          </View>
        </View>
      </View>
      
      {item.description && (
        <Text style={styles.taskDescription}>{item.description}</Text>
      )}
      
      {item.due_date && (
        <Text style={styles.taskDue}>
          Due: {new Date(item.due_date).toLocaleDateString()}
        </Text>
      )}
      
      {item.status === 'pending' && (
        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => handleCompleteTask(item.id)}
        >
          <Text style={styles.completeButtonText}>Mark as Complete</Text>
        </TouchableOpacity>
      )}
    </Card>
  );

  return (
    <LinearGradient
      colors={[Colors.dark.background, Colors.dark.backgroundElevated]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.header}>
          <Text style={styles.title}>My Tasks</Text>
          <Text style={styles.subtitle}>{tasks.length} tasks total</Text>
        </View>

        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No tasks assigned yet</Text>
            </Card>
          }
        />
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
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: Typography.fontSizes.base,
    color: Colors.dark.primary,
    fontWeight: Typography.fontWeights.medium,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: {
    fontSize: Typography.fontSizes.xxxl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: Typography.fontSizes.lg,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  taskCard: {
    marginBottom: 16,
  },
  taskHeader: {
    marginBottom: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
  },
  statusPending: {
    backgroundColor: Colors.dark.info + '30',
  },
  statusInProgress: {
    backgroundColor: Colors.dark.warning + '30',
  },
  statusCompleted: {
    backgroundColor: Colors.dark.success + '30',
  },
  statusText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.dark.text,
    textTransform: 'capitalize',
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
    lineHeight: Typography.lineHeights.relaxed * Typography.fontSizes.base,
  },
  taskDue: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.dark.primary,
    marginBottom: 12,
  },
  completeButton: {
    backgroundColor: Colors.dark.success,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  completeButtonText: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.dark.text,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: Typography.fontSizes.lg,
    color: Colors.dark.textSecondary,
  },
});
