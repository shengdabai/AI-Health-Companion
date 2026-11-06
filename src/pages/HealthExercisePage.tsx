import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Heart, 
  Activity, 
  Dumbbell, 
  Target, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  Download,
  Zap,
  Timer,
  Award
} from 'lucide-react';
import { ExercisePlan, DifficultyLevel, ExerciseType } from '../types/health';

/**
 * 运动建议页面组件
 * 提供体能评估和个性化运动计划制定
 */
const HealthExercisePage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [exercisePlan, setExercisePlan] = useState<ExercisePlan | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  
  // 体能评估和运动偏好表单数据
  const [assessmentData, setAssessmentData] = useState({
    fitnessLevel: 'beginner' as DifficultyLevel,
    exerciseExperience: '',
    currentActivity: '',
    timeAvailable: 30,
    exerciseFrequency: 3,
    goals: [] as string[],
    preferredTypes: [] as ExerciseType[],
    equipment: [] as string[],
    injuries: [] as string[],
    preferredTime: 'morning' as 'morning' | 'afternoon' | 'evening'
  });

  // 运动目标选项
  const fitnessGoals = [
    { id: 'weight_loss', label: '减脂瘦身', icon: '🔥', color: 'red' },
    { id: 'muscle_gain', label: '增肌塑形', icon: '💪', color: 'blue' },
    { id: 'endurance', label: '提升耐力', icon: '🏃', color: 'green' },
    { id: 'strength', label: '增强力量', icon: '🏋️', color: 'purple' },
    { id: 'flexibility', label: '改善柔韧性', icon: '🧘', color: 'pink' },
    { id: 'general_fitness', label: '整体健康', icon: '❤️', color: 'orange' }
  ];

  // 运动类型选项
  const exerciseTypes: { type: ExerciseType; label: string; icon: string; description: string }[] = [
    { type: 'cardio', label: '有氧运动', icon: '🏃', description: '跑步、游泳、骑行等' },
    { type: 'strength', label: '力量训练', icon: '🏋️', description: '举重、器械训练等' },
    { type: 'flexibility', label: '柔韧性训练', icon: '🤸', description: '拉伸、瑜伽等' },
    { type: 'balance', label: '平衡训练', icon: '⚖️', description: '平衡球、单腿站立等' },
    { type: 'sports', label: '运动项目', icon: '⚽', description: '篮球、网球、羽毛球等' },
    { type: 'yoga', label: '瑜伽', icon: '🧘', description: '哈他瑜伽、流瑜伽等' },
    { type: 'pilates', label: '普拉提', icon: '🤸', description: '核心训练、体态矫正' }
  ];

  // 可用器械选项
  const equipmentOptions = [
    '哑铃', '杠铃', '弹力带', '瑜伽垫', '跑步机', '动感单车', '健身球', '拉力器', '无器械'
  ];

  // 常见运动损伤
  const commonInjuries = [
    '膝盖疼痛', '腰部疼痛', '肩膀疼痛', '脚踝扭伤', '手腕疼痛', '颈部疼痛', '无运动损伤'
  ];

  /**
   * 处理表单输入变化
   */
  const handleInputChange = <K extends keyof typeof assessmentData,>(field: K, value: (typeof assessmentData)[K]) => {
    setAssessmentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * 处理多选项变化
   */
  const handleMultiSelectChange = (field: string, value: string) => {
    setAssessmentData(prev => {
      const currentValues = prev[field as keyof typeof prev] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(item => item !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [field]: newValues
      };
    });
  };

  /**
   * 验证当前步骤数据
   */
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(assessmentData.exerciseExperience && assessmentData.currentActivity);
      case 2:
        return assessmentData.goals.length > 0 && assessmentData.preferredTypes.length > 0;
      case 3:
        return true; // 可选步骤
      default:
        return true;
    }
  };

  /**
   * 下一步
   */
  const handleNextStep = () => {
    if (validateCurrentStep() && currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else if (currentStep === 3) {
      generateExercisePlan();
    }
  };

  /**
   * 上一步
   */
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  /**
   * 模拟生成运动计划
   */
  const generateExercisePlan = async () => {
    setIsLoading(true);
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // 生成示例运动计划
      const mockExercisePlan: ExercisePlan = {
        id: 'plan-' + Date.now(),
        userId: 'demo-user',
        workoutSchedule: {
          weeklyPlan: [
            {
              day: 1, // 周一
              exercises: [
                {
                  id: 'ex-1',
                  name: '热身慢跑',
                  description: '轻松的有氧热身运动',
                  type: 'cardio',
                  duration: 10,
                  caloriesBurned: 80,
                  equipment: [],
                  instructions: [
                    '保持轻松的节奏',
                    '注意呼吸节律',
                    '感觉身体逐渐热起来'
                  ]
                },
                {
                  id: 'ex-2',
                  name: '俯卧撑',
                  description: '经典的上肢力量训练',
                  type: 'strength',
                  duration: 15,
                  sets: 3,
                  reps: 12,
                  restTime: 60,
                  caloriesBurned: 50,
                  equipment: [],
                  instructions: [
                    '保持身体成一条直线',
                    '下降时胸部接近地面',
                    '推起时手臂完全伸直'
                  ]
                },
                {
                  id: 'ex-3',
                  name: '深蹲',
                  description: '下肢力量训练的基础动作',
                  type: 'strength',
                  duration: 15,
                  sets: 3,
                  reps: 15,
                  restTime: 60,
                  caloriesBurned: 60,
                  equipment: [],
                  instructions: [
                    '双脚与肩同宽站立',
                    '下蹲时膝盖不超过脚尖',
                    '保持背部挺直'
                  ]
                }
              ],
              totalDuration: 40,
              warmUp: [
                {
                  id: 'warmup-1',
                  name: '关节活动',
                  description: '活动各个关节',
                  type: 'flexibility',
                  duration: 5,
                  caloriesBurned: 15,
                  equipment: [],
                  instructions: ['颈部、肩部、腰部、膝盖、脚踝各方向转动']
                }
              ],
              coolDown: [
                {
                  id: 'cooldown-1',
                  name: '拉伸放松',
                  description: '运动后的拉伸放松',
                  type: 'flexibility',
                  duration: 10,
                  caloriesBurned: 20,
                  equipment: [],
                  instructions: ['拉伸主要肌群，保持每个动作15-30秒']
                }
              ]
            },
            {
              day: 3, // 周三
              exercises: [
                {
                  id: 'ex-4',
                  name: '快走',
                  description: '中等强度的有氧运动',
                  type: 'cardio',
                  duration: 25,
                  caloriesBurned: 150,
                  equipment: [],
                  instructions: [
                    '保持较快的步伐',
                    '摆臂自然',
                    '呼吸均匀'
                  ]
                },
                {
                  id: 'ex-5',
                  name: '平板支撑',
                  description: '核心力量训练',
                  type: 'strength',
                  duration: 10,
                  sets: 3,
                  reps: 1,
                  restTime: 60,
                  caloriesBurned: 30,
                  equipment: [],
                  instructions: [
                    '保持身体成一条直线',
                    '收紧核心肌群',
                    '保持正常呼吸'
                  ]
                }
              ],
              totalDuration: 35,
              warmUp: [
                {
                  id: 'warmup-2',
                  name: '动态拉伸',
                  description: '运动前的动态准备',
                  type: 'flexibility',
                  duration: 5,
                  caloriesBurned: 15,
                  equipment: [],
                  instructions: ['腿部摆动、臂部环绕等动态动作']
                }
              ],
              coolDown: [
                {
                  id: 'cooldown-2',
                  name: '静态拉伸',
                  description: '运动后的静态拉伸',
                  type: 'flexibility',
                  duration: 10,
                  caloriesBurned: 20,
                  equipment: [],
                  instructions: ['静态拉伸各个肌群']
                }
              ]
            },
            {
              day: 5, // 周五
              exercises: [
                {
                  id: 'ex-6',
                  name: '瑜伽流',
                  description: '柔韧性和平衡训练',
                  type: 'yoga',
                  duration: 30,
                  caloriesBurned: 120,
                  equipment: ['瑜伽垫'],
                  instructions: [
                    '跟随呼吸节奏',
                    '保持动作流畅',
                    '注意身体感受'
                  ]
                }
              ],
              totalDuration: 30,
              warmUp: [],
              coolDown: []
            }
          ],
          totalDuration: 315, // 每周总时长(分钟)
          frequency: 3, // 每周3次
          restDays: [2, 4, 6, 7] // 周二、四、六、日休息
        },
        difficultyLevel: assessmentData.fitnessLevel,
        progressTracking: {
          completedWorkouts: 0,
          totalWorkouts: 12, // 4周 * 3次/周
          caloriesBurned: 0,
          strengthProgress: {},
          enduranceProgress: {},
          bodyMeasurements: [],
          achievements: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setExercisePlan(mockExercisePlan);
      setCurrentStep(4); // 显示结果页面
    } catch (error) {
      console.error('生成运动计划失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 重新开始
   */
  const handleRestart = () => {
    setCurrentStep(1);
    setExercisePlan(null);
    setAssessmentData({
      fitnessLevel: 'beginner',
      exerciseExperience: '',
      currentActivity: '',
      timeAvailable: 30,
      exerciseFrequency: 3,
      goals: [],
      preferredTypes: [],
      equipment: [],
      injuries: [],
      preferredTime: 'morning'
    });
  };

  /**
   * 开始/暂停计时器
   */
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  /**
   * 重置计时器
   */
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  /**
   * 格式化时间显示
   */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 计时器效果
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  /**
   * 渲染步骤1：体能评估
   */
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Activity className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">体能评估</h2>
        <p className="text-gray-600">了解您的运动基础，为您制定合适的运动计划</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            您的运动水平 *
          </label>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { value: 'beginner' as const, label: '初学者', desc: '很少或从不运动' },
              { value: 'intermediate' as const, label: '中级', desc: '偶尔运动，有一定基础' },
              { value: 'advanced' as const, label: '高级', desc: '经常运动，有丰富经验' }
            ].map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => handleInputChange('fitnessLevel', level.value)}
                className={`p-4 text-center border rounded-xl transition-colors ${
                  assessmentData.fitnessLevel === level.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">{level.label}</div>
                <div className="text-sm text-gray-500 mt-1">{level.desc}</div>
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            运动经验描述 *
          </label>
          <textarea
            value={assessmentData.exerciseExperience}
            onChange={(e) => handleInputChange('exerciseExperience', e.target.value)}
            placeholder="请简单描述您的运动经验，比如：曾经练过什么运动、运动多长时间等"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            目前的运动状况 *
          </label>
          <textarea
            value={assessmentData.currentActivity}
            onChange={(e) => handleInputChange('currentActivity', e.target.value)}
            placeholder="请描述您目前的运动情况，比如：每周运动几次、主要做什么运动等"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              每次运动时间 (分钟)
            </label>
            <select
              value={assessmentData.timeAvailable}
              onChange={(e) => handleInputChange('timeAvailable', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={15}>15分钟</option>
              <option value={30}>30分钟</option>
              <option value={45}>45分钟</option>
              <option value={60}>60分钟</option>
              <option value={90}>90分钟</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              每周运动频次
            </label>
            <select
              value={assessmentData.exerciseFrequency}
              onChange={(e) => handleInputChange('exerciseFrequency', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>1次/周</option>
              <option value={2}>2次/周</option>
              <option value={3}>3次/周</option>
              <option value={4}>4次/周</option>
              <option value={5}>5次/周</option>
              <option value={6}>6次/周</option>
              <option value={7}>每天</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            偏好的运动时间
          </label>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { value: 'morning' as const, label: '早晨', desc: '6:00-10:00' },
              { value: 'afternoon' as const, label: '下午', desc: '14:00-18:00' },
              { value: 'evening' as const, label: '晚上', desc: '18:00-22:00' }
            ].map((time) => (
              <button
                key={time.value}
                type="button"
                onClick={() => handleInputChange('preferredTime', time.value)}
                className={`p-3 text-center border rounded-lg transition-colors ${
                  assessmentData.preferredTime === time.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">{time.label}</div>
                <div className="text-xs text-gray-500 mt-1">{time.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * 渲染步骤2：运动目标和偏好
   */
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Target className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">运动目标与偏好</h2>
        <p className="text-gray-600">选择您的运动目标和喜欢的运动类型</p>
      </div>
      
      <div className="space-y-6">
        {/* 运动目标 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">运动目标 *</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {fitnessGoals.map((goal) => (
              <button
                key={goal.id}
                type="button"
                onClick={() => handleMultiSelectChange('goals', goal.id)}
                className={`p-4 text-center border rounded-xl transition-colors ${
                  assessmentData.goals.includes(goal.id)
                    ? `border-${goal.color}-500 bg-${goal.color}-50 text-${goal.color}-700`
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-2">{goal.icon}</div>
                <div className="font-medium">{goal.label}</div>
              </button>
            ))}
          </div>
        </div>
        
        {/* 运动类型偏好 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">偏好的运动类型 *</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {exerciseTypes.map((type) => (
              <button
                key={type.type}
                type="button"
                onClick={() => handleMultiSelectChange('preferredTypes', type.type)}
                className={`p-4 text-left border rounded-xl transition-colors ${
                  assessmentData.preferredTypes.includes(type.type)
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center mb-2">
                  <span className="text-xl mr-2">{type.icon}</span>
                  <span className="font-medium">{type.label}</span>
                </div>
                <div className="text-sm text-gray-600">{type.description}</div>
              </button>
            ))}
          </div>
        </div>
        
        {(assessmentData.goals.length === 0 || assessmentData.preferredTypes.length === 0) && (
          <div className="text-center text-gray-500 mt-4">
            <AlertCircle className="h-5 w-5 inline mr-1" />
            请至少选择一个运动目标和一种运动类型
          </div>
        )}
      </div>
    </div>
  );

  /**
   * 渲染步骤3：器械和限制
   */
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Dumbbell className="h-16 w-16 text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">器械与限制</h2>
        <p className="text-gray-600">告诉我们您可用的器械和身体限制</p>
      </div>
      
      <div className="space-y-6">
        {/* 可用器械 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">可用器械（可选）</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {equipmentOptions.map((equipment) => (
              <button
                key={equipment}
                type="button"
                onClick={() => handleMultiSelectChange('equipment', equipment)}
                className={`p-3 text-sm border rounded-lg transition-colors ${
                  assessmentData.equipment.includes(equipment)
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {equipment}
              </button>
            ))}
          </div>
        </div>
        
        {/* 运动损伤史 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">运动损伤史（可选）</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {commonInjuries.map((injury) => (
              <button
                key={injury}
                type="button"
                onClick={() => handleMultiSelectChange('injuries', injury)}
                className={`p-3 text-sm border rounded-lg transition-colors ${
                  assessmentData.injuries.includes(injury)
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {injury}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * 渲染运动计划结果
   */
  const renderExercisePlan = () => {
    if (!exercisePlan) return null;
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">您的专属运动计划</h2>
          <p className="text-gray-600">基于您的体能评估和运动目标，我们为您制定了以下运动计划</p>
        </div>
        
        {/* 计划概览 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">计划概览</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{exercisePlan.workoutSchedule.frequency}</div>
              <div className="text-sm text-gray-600">次/周</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{Math.round(exercisePlan.workoutSchedule.totalDuration / exercisePlan.workoutSchedule.frequency)}</div>
              <div className="text-sm text-gray-600">分钟/次</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{exercisePlan.workoutSchedule.totalDuration}</div>
              <div className="text-sm text-gray-600">分钟/周</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{exercisePlan.difficultyLevel === 'beginner' ? '初级' : exercisePlan.difficultyLevel === 'intermediate' ? '中级' : '高级'}</div>
              <div className="text-sm text-gray-600">难度等级</div>
            </div>
          </div>
        </div>
        
        {/* 运动计时器 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">运动计时器</h3>
            <div className="flex items-center space-x-2">
              <Timer className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">帮助您控制运动时间</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-4">{formatTime(timerSeconds)}</div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={toggleTimer}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center ${
                  isTimerRunning 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isTimerRunning ? (
                  <><Pause className="h-4 w-4 mr-2" />暂停</>
                ) : (
                  <><Play className="h-4 w-4 mr-2" />开始</>
                )}
              </button>
              <button
                onClick={resetTimer}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                重置
              </button>
            </div>
          </div>
        </div>
        
        {/* 每周训练计划 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">每周训练计划</h3>
          
          {exercisePlan.workoutSchedule.weeklyPlan.map((dayPlan, index) => {
            const dayNames = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            return (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-semibold">{dayNames[dayPlan.day]}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{dayNames[dayPlan.day]}训练</h4>
                      <p className="text-sm text-gray-500">总时长：{dayPlan.totalDuration}分钟</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {dayPlan.exercises.reduce((total, ex) => total + ex.caloriesBurned, 0)} 卡
                    </div>
                    <div className="text-xs text-gray-500">预计消耗</div>
                  </div>
                </div>
                
                {/* 热身 */}
                {dayPlan.warmUp.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Zap className="h-4 w-4 mr-1 text-yellow-500" />
                      热身
                    </h5>
                    {dayPlan.warmUp.map((exercise) => (
                      <div key={exercise.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">{exercise.name}</span>
                          <span className="text-sm text-gray-600">{exercise.duration}分钟</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{exercise.description}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 主要训练 */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Activity className="h-4 w-4 mr-1 text-blue-500" />
                    主要训练
                  </h5>
                  {dayPlan.exercises.map((exercise) => (
                    <div key={exercise.id} className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-2">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium text-gray-900">{exercise.name}</span>
                          <p className="text-sm text-gray-600">{exercise.description}</p>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-gray-900">
                            {exercise.sets && exercise.reps 
                              ? `${exercise.sets}组 × ${exercise.reps}次`
                              : `${exercise.duration}分钟`
                            }
                          </div>
                          <div className="text-gray-500">{exercise.caloriesBurned}卡</div>
                        </div>
                      </div>
                      {exercise.instructions.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <strong>要点：</strong>{exercise.instructions.join('；')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* 放松 */}
                {dayPlan.coolDown.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Heart className="h-4 w-4 mr-1 text-green-500" />
                      放松整理
                    </h5>
                    {dayPlan.coolDown.map((exercise) => (
                      <div key={exercise.id} className="bg-green-50 border-l-4 border-green-400 p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">{exercise.name}</span>
                          <span className="text-sm text-gray-600">{exercise.duration}分钟</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{exercise.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
            <Download className="h-5 w-5 mr-2" />
            下载运动计划
          </button>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
            <Calendar className="h-5 w-5 mr-2" />
            添加到日历
          </button>
          <button 
            onClick={handleRestart}
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            重新制定计划
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center text-gray-600 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                返回首页
              </Link>
              <div className="flex items-center space-x-2">
                <Heart className="h-6 w-6 text-purple-600" />
                <span className="text-lg font-semibold text-gray-900">运动建议</span>
              </div>
            </div>
            {currentStep < 4 && (
              <div className="text-sm text-gray-500">
                步骤 {currentStep} / 3
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 进度条 */}
        {currentStep < 4 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">完成进度</span>
              <span className="text-sm text-gray-600">{Math.round((currentStep / 3) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* 内容区域 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">正在生成您的专属运动计划</h3>
              <p className="text-gray-600">AI正在根据您的体能评估制定最适合的运动方案，请稍候...</p>
            </div>
          ) : (
            <>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderExercisePlan()}
            </>
          )}
        </div>
        
        {/* 操作按钮 */}
        {!isLoading && currentStep < 4 && (
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              上一步
            </button>
            <button
              onClick={handleNextStep}
              disabled={!validateCurrentStep()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {currentStep === 3 ? (
                <>
                  <Award className="h-5 w-5 mr-2" />
                  生成运动计划
                </>
              ) : (
                '下一步'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthExercisePage;
