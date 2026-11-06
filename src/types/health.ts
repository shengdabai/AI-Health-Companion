/**
 * AI健康顾问网站类型定义
 * 包含用户健康档案、问答、饮食建议、运动建议等相关类型
 */

// 基础类型定义
export type Gender = 'male' | 'female' | 'other';
export type MembershipType = 'free' | 'premium' | 'vip';
export type MessageRole = 'user' | 'assistant';
export type PlanStatus = 'active' | 'completed' | 'expired';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// 用户基础信息
export interface User {
  id: string;
  email: string;
  name: string;
  membershipType: MembershipType;
  createdAt: string;
  updatedAt: string;
}

// 健康档案类型
export interface HealthProfile {
  id: string;
  userId: string;
  age: number;
  gender: Gender;
  height: number; // 身高(cm)
  weight: number; // 体重(kg)
  medicalConditions: string[]; // 疾病史
  dietaryRestrictions: string[]; // 饮食限制
  fitnessGoals: string[]; // 健身目标
  updatedAt: string;
}

// 健康问答相关类型
export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  context: Pick<ChatMessage, 'role' | 'content'>[]; // 对话上下文
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  confidenceScore: number; // 置信度评分 0-1
  createdAt: string;
}

// AI问答请求和响应类型
export interface ChatRequest {
  question: string;
  context?: Pick<ChatMessage, 'role' | 'content'>[];
  userId: string;
}

export interface ChatResponse {
  answer: string;
  confidence: number;
  suggestions: string[];
}

// 饮食建议相关类型
export interface NutritionPlan {
  id: string;
  userId: string;
  mealPlan: MealPlan;
  nutritionAnalysis: NutritionAnalysis;
  status: PlanStatus;
  createdAt: string;
  expiresAt: string;
}

export interface MealPlan {
  breakfast: Meal[];
  lunch: Meal[];
  dinner: Meal[];
  snacks: Meal[];
  totalCalories: number;
  planDuration: number; // 计划天数
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  calories: number;
  preparationTime: number; // 准备时间(分钟)
  cookingInstructions: string[];
  imageUrl?: string;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string; // 单位：g, ml, 个等
  calories: number;
}

export interface NutritionAnalysis {
  totalCalories: number;
  protein: number; // 蛋白质(g)
  carbohydrates: number; // 碳水化合物(g)
  fat: number; // 脂肪(g)
  fiber: number; // 纤维(g)
  sugar: number; // 糖分(g)
  sodium: number; // 钠(mg)
  vitamins: Record<string, number>; // 维生素含量
  minerals: Record<string, number>; // 矿物质含量
}

// 饮食建议请求类型
export interface NutritionPlanRequest {
  userProfile: HealthProfile;
  goals: string[];
  preferences?: {
    cuisineTypes: string[];
    allergies: string[];
    dietaryRestrictions: string[];
    preferredMealTimes: string[];
  };
}

// 运动建议相关类型
export interface ExercisePlan {
  id: string;
  userId: string;
  workoutSchedule: WorkoutSchedule;
  difficultyLevel: DifficultyLevel;
  progressTracking: ProgressTracking;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSchedule {
  weeklyPlan: WeeklyWorkout[];
  totalDuration: number; // 总时长(分钟/周)
  frequency: number; // 每周频次
  restDays: number[];
}

export interface WeeklyWorkout {
  day: number; // 1-7 代表周一到周日
  exercises: Exercise[];
  totalDuration: number;
  warmUp: Exercise[];
  coolDown: Exercise[];
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  type: ExerciseType;
  duration: number; // 持续时间(分钟)
  sets?: number; // 组数
  reps?: number; // 每组次数
  weight?: number; // 重量(kg)
  restTime?: number; // 休息时间(秒)
  caloriesBurned: number;
  equipment: string[];
  instructions: string[];
  videoUrl?: string;
  imageUrl?: string;
}

export type ExerciseType = 
  | 'cardio' // 有氧运动
  | 'strength' // 力量训练
  | 'flexibility' // 柔韧性
  | 'balance' // 平衡性
  | 'sports' // 运动项目
  | 'yoga' // 瑜伽
  | 'pilates'; // 普拉提

export interface ProgressTracking {
  completedWorkouts: number;
  totalWorkouts: number;
  caloriesBurned: number;
  averageHeartRate?: number;
  strengthProgress: Record<string, number[]>; // 力量进步记录
  enduranceProgress: Record<string, number[]>; // 耐力进步记录
  bodyMeasurements: BodyMeasurement[];
  achievements: Achievement[];
}

export interface BodyMeasurement {
  date: string;
  weight: number;
  bodyFat?: number;
  muscleMass?: number;
  measurements: Record<string, number>; // 各部位尺寸
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: string;
  icon: string;
}

// 运动建议请求类型
export interface ExercisePlanRequest {
  fitnessLevel: DifficultyLevel;
  goals: string[];
  timeAvailable: number; // 可用时间(分钟/天)
  equipment?: string[];
  preferences?: {
    exerciseTypes: ExerciseType[];
    avoidInjuries: string[];
    preferredTime: 'morning' | 'afternoon' | 'evening';
  };
}

// 健康记录类型
export interface HealthRecord {
  id: string;
  profileId: string;
  recordType: HealthRecordType;
  data: unknown;
  recordedAt: string;
}

export type HealthRecordType = 
  | 'weight' // 体重记录
  | 'blood_pressure' // 血压
  | 'heart_rate' // 心率
  | 'sleep' // 睡眠记录
  | 'mood' // 情绪记录
  | 'symptoms' // 症状记录
  | 'medication' // 用药记录
  | 'exercise' // 运动记录
  | 'nutrition'; // 营养摄入记录

// 健康评估报告
export interface HealthReport {
  id: string;
  userId: string;
  reportType: 'weekly' | 'monthly' | 'quarterly';
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    overallScore: number; // 总体健康评分 0-100
    improvements: string[];
    concerns: string[];
    recommendations: string[];
  };
  metrics: {
    weightTrend: number; // 体重变化趋势
    exerciseCompliance: number; // 运动完成度
    nutritionScore: number; // 营养评分
    sleepQuality: number; // 睡眠质量
  };
  charts: {
    weightChart: ChartData;
    exerciseChart: ChartData;
    nutritionChart: ChartData;
  };
  createdAt: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

// API响应通用类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页类型
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 表单验证类型
export interface ValidationError {
  field: string;
  message: string;
}

// 健康目标类型
export interface HealthGoal {
  id: string;
  userId: string;
  type: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'endurance' | 'flexibility' | 'general_health';
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  status: 'active' | 'completed' | 'paused';
  progress: number; // 进度百分比 0-100
  createdAt: string;
  updatedAt: string;
}

// 专家咨询类型
export interface ExpertConsultation {
  id: string;
  userId: string;
  expertId: string;
  type: 'nutrition' | 'fitness' | 'medical' | 'mental_health';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt: string;
  duration: number; // 咨询时长(分钟)
  notes: string;
  recommendations: string[];
  followUpRequired: boolean;
  createdAt: string;
}

export interface Expert {
  id: string;
  name: string;
  specialty: string[];
  qualifications: string[];
  experience: number; // 从业年限
  rating: number; // 评分 0-5
  avatar: string;
  bio: string;
  availability: {
    days: number[]; // 可预约的星期几
    timeSlots: string[]; // 可预约的时间段
  };
}