import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Heart, 
  User, 
  Scale, 
  Ruler, 
  Target, 
  Apple, 
  Clock, 
  ChefHat, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Download,
  Calendar
} from 'lucide-react';
import { NutritionPlan } from '../types/health';

const PROFILE_LIMITS = {
  age: { min: 1, max: 120 },
  height: { min: 100, max: 250 },
  weight: { min: 30, max: 300 },
};

/**
 * 饮食建议页面组件
 * 提供个人信息录入和个性化营养方案生成
 */
const HealthNutritionPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  
  // 用户健康档案表单数据
  const [profileData, setProfileData] = useState({
    age: '',
    gender: 'male' as 'male' | 'female' | 'other',
    height: '',
    weight: '',
    activityLevel: 'moderate' as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
    goals: [] as string[],
    medicalConditions: [] as string[],
    dietaryRestrictions: [] as string[],
    allergies: [] as string[],
    preferredMeals: [] as string[]
  });

  const unsupportedProfileReason = profileData.gender === 'other'
    ? '当前热量计算未实现所选性别的公式，无法生成估算。'
    : profileData.medicalConditions.length || profileData.dietaryRestrictions.length || profileData.allergies.length
      ? '当前示例菜单尚未适配疾病史、饮食限制或过敏原，无法生成符合这些条件的方案。'
      : '';

  // 健康目标选项
  const healthGoals = [
    { id: 'weight_loss', label: '减重瘦身', icon: '⚖️' },
    { id: 'weight_gain', label: '增重增肌', icon: '💪' },
    { id: 'maintain_weight', label: '维持体重', icon: '⚖️' },
    { id: 'muscle_gain', label: '增肌塑形', icon: '🏋️' },
    { id: 'improve_health', label: '改善健康', icon: '❤️' },
    { id: 'boost_energy', label: '提升精力', icon: '⚡' }
  ];

  // 疾病史选项
  const medicalConditions = [
    '糖尿病', '高血压', '高血脂', '心脏病', '肾病', '肝病', '甲状腺疾病', '消化系统疾病'
  ];

  // 饮食限制选项
  const dietaryRestrictions = [
    '素食主义', '严格素食', '低盐饮食', '低糖饮食', '低脂饮食', '生酮饮食', '地中海饮食', '无麸质饮食'
  ];

  // 常见过敏原
  const commonAllergies = [
    '牛奶', '鸡蛋', '坚果', '海鲜', '大豆', '小麦', '花生', '芝麻'
  ];

  // 偏好餐食
  const mealPreferences = [
    '中式菜肴', '西式菜肴', '日韩料理', '东南亚菜', '地中海菜', '素食料理', '轻食沙拉', '汤品粥类'
  ];

  /**
   * 处理表单输入变化
   */
  const handleInputChange = <K extends keyof typeof profileData,>(field: K, value: (typeof profileData)[K]) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * 处理多选项变化
   */
  const handleMultiSelectChange = (field: string, value: string) => {
    setProfileData(prev => {
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
        return Object.entries(PROFILE_LIMITS).every(([field, { min, max }]) => {
          const value = Number(profileData[field as keyof typeof PROFILE_LIMITS]);
          return Number.isFinite(value) && value >= min && value <= max
            && (field !== 'age' || Number.isInteger(value));
        });
      case 2:
        return profileData.goals.length > 0;
      case 3:
        return !unsupportedProfileReason;
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
    } else if (currentStep === 3 && validateCurrentStep()) {
      generateNutritionPlan();
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
   * 模拟生成营养方案
   */
  const generateNutritionPlan = async () => {
    if (unsupportedProfileReason) return;
    setIsLoading(true);
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 计算基础代谢率 (BMR)
      const age = parseInt(profileData.age);
      const height = parseFloat(profileData.height);
      const weight = parseFloat(profileData.weight);
      
      let bmr = 0;
      if (profileData.gender === 'male') {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      }
      
      // 根据活动水平调整
      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
      };
      
      const tdee = bmr * activityMultipliers[profileData.activityLevel];
      
      // 根据目标调整卡路里
      let targetCalories = tdee;
      if (profileData.goals.includes('weight_loss')) {
        targetCalories = tdee - 500; // 减重：每天减少500卡路里
      } else if (profileData.goals.includes('weight_gain')) {
        targetCalories = tdee + 500; // 增重：每天增加500卡路里
      }
      
      // 生成示例营养方案
      const mockNutritionPlan: NutritionPlan = {
        id: 'plan-' + Date.now(),
        userId: 'demo-user',
        mealPlan: {
          breakfast: [
            {
              id: 'breakfast-1',
              name: '燕麦粥配蓝莓',
              description: '营养丰富的早餐，提供持久能量',
              ingredients: [
                { name: '燕麦片', amount: 50, unit: 'g', calories: 190 },
                { name: '牛奶', amount: 200, unit: 'ml', calories: 120 },
                { name: '蓝莓', amount: 80, unit: 'g', calories: 45 },
                { name: '蜂蜜', amount: 15, unit: 'g', calories: 45 }
              ],
              calories: 400,
              preparationTime: 10,
              cookingInstructions: [
                '将燕麦片倒入碗中',
                '加入热牛奶搅拌均匀',
                '放置2-3分钟让燕麦软化',
                '加入蓝莓和蜂蜜即可享用'
              ]
            }
          ],
          lunch: [
            {
              id: 'lunch-1',
              name: '鸡胸肉沙拉',
              description: '高蛋白低脂的健康午餐',
              ingredients: [
                { name: '鸡胸肉', amount: 120, unit: 'g', calories: 200 },
                { name: '生菜', amount: 100, unit: 'g', calories: 15 },
                { name: '西红柿', amount: 80, unit: 'g', calories: 15 },
                { name: '黄瓜', amount: 60, unit: 'g', calories: 10 },
                { name: '橄榄油', amount: 10, unit: 'ml', calories: 90 }
              ],
              calories: 330,
              preparationTime: 15,
              cookingInstructions: [
                '鸡胸肉用少量盐和胡椒调味',
                '平底锅煎制至熟透，切片',
                '蔬菜洗净切好装盘',
                '淋上橄榄油和柠檬汁即可'
              ]
            }
          ],
          dinner: [
            {
              id: 'dinner-1',
              name: '三文鱼配蒸蔬菜',
              description: '富含Omega-3的营养晚餐',
              ingredients: [
                { name: '三文鱼', amount: 150, unit: 'g', calories: 280 },
                { name: '西兰花', amount: 100, unit: 'g', calories: 25 },
                { name: '胡萝卜', amount: 80, unit: 'g', calories: 30 },
                { name: '糙米', amount: 80, unit: 'g', calories: 280 }
              ],
              calories: 615,
              preparationTime: 20,
              cookingInstructions: [
                '三文鱼用盐和柠檬汁腌制10分钟',
                '烤箱180度烤制15分钟',
                '蔬菜蒸制8-10分钟至软嫩',
                '糙米煮熟，搭配食用'
              ]
            }
          ],
          snacks: [
            {
              id: 'snack-1',
              name: '坚果酸奶',
              description: '健康的下午茶点心',
              ingredients: [
                { name: '希腊酸奶', amount: 150, unit: 'g', calories: 100 },
                { name: '混合坚果', amount: 20, unit: 'g', calories: 120 }
              ],
              calories: 220,
              preparationTime: 2,
              cookingInstructions: ['将坚果撒在酸奶上即可享用']
            }
          ],
          totalCalories: Math.round(targetCalories),
          planDuration: 7
        },
        nutritionAnalysis: {
          totalCalories: Math.round(targetCalories),
          protein: Math.round(targetCalories * 0.25 / 4), // 25%来自蛋白质
          carbohydrates: Math.round(targetCalories * 0.45 / 4), // 45%来自碳水
          fat: Math.round(targetCalories * 0.30 / 9), // 30%来自脂肪
          fiber: 35,
          sugar: 50,
          sodium: 2000,
          vitamins: {
            'A': 900,
            'C': 90,
            'D': 15,
            'E': 15,
            'B12': 2.4
          },
          minerals: {
            '钙': 1000,
            '铁': 18,
            '锌': 11,
            '镁': 400
          }
        },
        status: 'active',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30天后过期
      };
      
      setNutritionPlan(mockNutritionPlan);
      setCurrentStep(4); // 显示结果页面
    } catch (error) {
      console.error('生成营养方案失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 重新开始
   */
  const handleRestart = () => {
    setCurrentStep(1);
    setNutritionPlan(null);
    setProfileData({
      age: '',
      gender: 'male',
      height: '',
      weight: '',
      activityLevel: 'moderate',
      goals: [],
      medicalConditions: [],
      dietaryRestrictions: [],
      allergies: [],
      preferredMeals: []
    });
  };

  /**
   * 渲染步骤1：基本信息
   */
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <User className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">基本信息</h2>
        <p className="text-gray-600">请填写您的基本身体信息，我们将据此为您制定个性化营养方案</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="nutrition-age" className="block text-sm font-medium text-gray-700 mb-2">
            年龄 *
          </label>
          <input
            id="nutrition-age"
            type="number"
            value={profileData.age}
            onChange={(e) => handleInputChange('age', e.target.value)}
            placeholder="请输入年龄"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min={PROFILE_LIMITS.age.min}
            max={PROFILE_LIMITS.age.max}
          />
        </div>
        
        <div>
          <label htmlFor="nutrition-gender" className="block text-sm font-medium text-gray-700 mb-2">
            性别 *
          </label>
          <select
            id="nutrition-gender"
            value={profileData.gender}
            onChange={(e) => { const value = e.target.value; if (value === 'male' || value === 'female' || value === 'other') handleInputChange('gender', value); }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="male">男性</option>
            <option value="female">女性</option>
            <option value="other">其他</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="nutrition-height" className="block text-sm font-medium text-gray-700 mb-2">
            身高 (cm) *
          </label>
          <div className="relative">
            <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="nutrition-height"
              type="number"
              value={profileData.height}
              onChange={(e) => handleInputChange('height', e.target.value)}
              placeholder="请输入身高"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={PROFILE_LIMITS.height.min}
              max={PROFILE_LIMITS.height.max}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="nutrition-weight" className="block text-sm font-medium text-gray-700 mb-2">
            体重 (kg) *
          </label>
          <div className="relative">
            <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="nutrition-weight"
              type="number"
              value={profileData.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              placeholder="请输入体重"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={PROFILE_LIMITS.weight.min}
              max={PROFILE_LIMITS.weight.max}
              step="0.1"
            />
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          活动水平 *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { value: 'sedentary' as const, label: '久坐', desc: '很少运动' },
            { value: 'light' as const, label: '轻度', desc: '每周1-3次' },
            { value: 'moderate' as const, label: '中度', desc: '每周3-5次' },
            { value: 'active' as const, label: '活跃', desc: '每周6-7次' },
            { value: 'very_active' as const, label: '非常活跃', desc: '每天2次' }
          ].map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => handleInputChange('activityLevel', level.value)}
              className={`p-3 text-center border rounded-lg transition-colors ${
                profileData.activityLevel === level.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">{level.label}</div>
              <div className="text-xs text-gray-500 mt-1">{level.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  /**
   * 渲染步骤2：健康目标
   */
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Target className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">健康目标</h2>
        <p className="text-gray-600">选择您的健康目标，我们将为您量身定制营养方案</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4">
        {healthGoals.map((goal) => (
          <button
            key={goal.id}
            type="button"
            onClick={() => handleMultiSelectChange('goals', goal.id)}
            className={`p-4 text-center border rounded-xl transition-colors ${
              profileData.goals.includes(goal.id)
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="text-2xl mb-2">{goal.icon}</div>
            <div className="font-medium">{goal.label}</div>
          </button>
        ))}
      </div>
      
      {profileData.goals.length === 0 && (
        <div className="text-center text-gray-500 mt-4">
          <AlertCircle className="h-5 w-5 inline mr-1" />
          请至少选择一个健康目标
        </div>
      )}
    </div>
  );

  /**
   * 渲染步骤3：饮食偏好
   */
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Apple className="h-16 w-16 text-orange-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">饮食偏好</h2>
        <p className="text-gray-600">告诉我们您的饮食限制和偏好，让营养方案更适合您</p>
      </div>
      
      <div className="space-y-6">
        {/* 疾病史 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">疾病史（可选）</h3>
          <div className="grid md:grid-cols-4 gap-3">
            {medicalConditions.map((condition) => (
              <button
                key={condition}
                type="button"
                onClick={() => handleMultiSelectChange('medicalConditions', condition)}
                className={`p-3 text-sm border rounded-lg transition-colors ${
                  profileData.medicalConditions.includes(condition)
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {condition}
              </button>
            ))}
          </div>
        </div>
        
        {/* 饮食限制 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">饮食限制（可选）</h3>
          <div className="grid md:grid-cols-4 gap-3">
            {dietaryRestrictions.map((restriction) => (
              <button
                key={restriction}
                type="button"
                onClick={() => handleMultiSelectChange('dietaryRestrictions', restriction)}
                className={`p-3 text-sm border rounded-lg transition-colors ${
                  profileData.dietaryRestrictions.includes(restriction)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {restriction}
              </button>
            ))}
          </div>
        </div>
        
        {/* 过敏原 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">过敏原（可选）</h3>
          <div className="grid md:grid-cols-4 gap-3">
            {commonAllergies.map((allergy) => (
              <button
                key={allergy}
                type="button"
                onClick={() => handleMultiSelectChange('allergies', allergy)}
                className={`p-3 text-sm border rounded-lg transition-colors ${
                  profileData.allergies.includes(allergy)
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {allergy}
              </button>
            ))}
          </div>
        </div>
        
        {/* 偏好菜系 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">偏好菜系（可选）</h3>
          <div className="grid md:grid-cols-4 gap-3">
            {mealPreferences.map((preference) => (
              <button
                key={preference}
                type="button"
                onClick={() => handleMultiSelectChange('preferredMeals', preference)}
                className={`p-3 text-sm border rounded-lg transition-colors ${
                  profileData.preferredMeals.includes(preference)
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {preference}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * 渲染营养方案结果
   */
  const renderNutritionPlan = () => {
    if (!nutritionPlan) return null;
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">示例营养方案</h2>
          <p className="text-gray-600">热量目标由本地公式估算，餐食为固定示例，未按热量目标调整份量。</p>
        </div>
        
        {/* 营养概览 */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">每日营养目标</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{nutritionPlan.nutritionAnalysis.totalCalories}</div>
              <div className="text-sm text-gray-600">总卡路里</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{nutritionPlan.nutritionAnalysis.protein}g</div>
              <div className="text-sm text-gray-600">蛋白质</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{nutritionPlan.nutritionAnalysis.carbohydrates}g</div>
              <div className="text-sm text-gray-600">碳水化合物</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{nutritionPlan.nutritionAnalysis.fat}g</div>
              <div className="text-sm text-gray-600">脂肪</div>
            </div>
          </div>
        </div>
        
        {/* 每日餐食计划 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">每日餐食计划</h3>
          
          {/* 早餐 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-yellow-600 font-semibold">早</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">早餐</h4>
                <p className="text-sm text-gray-500">建议时间：7:00-9:00</p>
              </div>
            </div>
            {nutritionPlan.mealPlan.breakfast.map((meal) => (
              <div key={meal.id} className="border-l-4 border-yellow-400 pl-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-medium text-gray-900">{meal.name}</h5>
                    <p className="text-sm text-gray-600">{meal.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">{meal.calories} 卡</div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {meal.preparationTime}分钟
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>食材：</strong>
                  {meal.ingredients.map(ing => `${ing.name} ${ing.amount}${ing.unit}`).join('、')}
                </div>
              </div>
            ))}
          </div>
          
          {/* 午餐 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-semibold">午</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">午餐</h4>
                <p className="text-sm text-gray-500">建议时间：12:00-13:30</p>
              </div>
            </div>
            {nutritionPlan.mealPlan.lunch.map((meal) => (
              <div key={meal.id} className="border-l-4 border-green-400 pl-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-medium text-gray-900">{meal.name}</h5>
                    <p className="text-sm text-gray-600">{meal.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">{meal.calories} 卡</div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {meal.preparationTime}分钟
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>食材：</strong>
                  {meal.ingredients.map(ing => `${ing.name} ${ing.amount}${ing.unit}`).join('、')}
                </div>
              </div>
            ))}
          </div>
          
          {/* 晚餐 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-semibold">晚</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">晚餐</h4>
                <p className="text-sm text-gray-500">建议时间：18:00-19:30</p>
              </div>
            </div>
            {nutritionPlan.mealPlan.dinner.map((meal) => (
              <div key={meal.id} className="border-l-4 border-blue-400 pl-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-medium text-gray-900">{meal.name}</h5>
                    <p className="text-sm text-gray-600">{meal.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">{meal.calories} 卡</div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {meal.preparationTime}分钟
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>食材：</strong>
                  {meal.ingredients.map(ing => `${ing.name} ${ing.amount}${ing.unit}`).join('、')}
                </div>
              </div>
            ))}
          </div>
          
          {/* 加餐 */}
          {nutritionPlan.mealPlan.snacks.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-semibold">加</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">加餐</h4>
                  <p className="text-sm text-gray-500">建议时间：15:00-16:00</p>
                </div>
              </div>
              {nutritionPlan.mealPlan.snacks.map((meal) => (
                <div key={meal.id} className="border-l-4 border-purple-400 pl-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-medium text-gray-900">{meal.name}</h5>
                      <p className="text-sm text-gray-600">{meal.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">{meal.calories} 卡</div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {meal.preparationTime}分钟
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>食材：</strong>
                    {meal.ingredients.map(ing => `${ing.name} ${ing.amount}${ing.unit}`).join('、')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
            <Download className="h-5 w-5 mr-2" />
            下载营养方案
          </button>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
            <Calendar className="h-5 w-5 mr-2" />
            添加到日历
          </button>
          <button 
            onClick={handleRestart}
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            重新制定方案
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center text-gray-600 hover:text-green-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                返回首页
              </Link>
              <div className="flex items-center space-x-2">
                <Heart className="h-6 w-6 text-green-600" />
                <span className="text-lg font-semibold text-gray-900">饮食建议</span>
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
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* 内容区域 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">正在生成示例营养方案</h3>
              <p className="text-gray-600">正在使用本地公式估算热量并加载固定示例餐食，请稍候...</p>
            </div>
          ) : (
            <>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 3 && unsupportedProfileReason && (
                <p role="alert" className="mt-4 text-red-600">{unsupportedProfileReason}</p>
              )}
              {currentStep === 4 && renderNutritionPlan()}
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
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {currentStep === 3 ? (
                <>
                  <ChefHat className="h-5 w-5 mr-2" />
                  生成营养方案
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

export default HealthNutritionPage;
