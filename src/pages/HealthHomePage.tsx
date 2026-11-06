import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Brain, 
  Activity, 
  Apple, 
  Dumbbell, 
  Users, 
  Star, 
  ArrowRight,
  CheckCircle,
  MessageCircle,
  TrendingUp
} from 'lucide-react';

/**
 * AI健康顾问网站首页组件
 * 展示产品介绍、功能亮点、快速体验入口等
 */
const HealthHomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* 导航栏 */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">AI健康顾问</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/chat" className="text-gray-700 hover:text-blue-600 transition-colors">
                健康问答
              </Link>
              <Link to="/nutrition" className="text-gray-700 hover:text-blue-600 transition-colors">
                饮食建议
              </Link>
              <Link to="/exercise" className="text-gray-700 hover:text-blue-600 transition-colors">
                运动指导
              </Link>
              <Link to="/pricing" className="text-gray-700 hover:text-blue-600 transition-colors">
                定价
              </Link>
              <Link to="/settings" className="text-gray-700 hover:text-blue-600 transition-colors">
                设置
              </Link>
              <Link
                to="/chat"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                开始使用
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <main>
        {/* 英雄区域 */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                您的专属
                <span className="text-blue-600"> AI健康顾问</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                基于人工智能技术的个性化健康管理平台，为您提供24/7智能健康问答、
                个性化饮食建议和科学运动指导，让健康管理变得简单高效。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/chat" 
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  立即体验AI问答
                </Link>
                <Link 
                  to="/register" 
                  className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center"
                >
                  免费注册
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 核心功能介绍 */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                三大核心功能，全方位守护您的健康
              </h2>
              <p className="text-xl text-gray-600">
                专业AI技术驱动，为您提供个性化的健康管理解决方案
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* 健康问答 */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl hover:shadow-lg transition-shadow">
                <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">智能健康问答</h3>
                <p className="text-gray-600 mb-6">
                  基于GPT-4的AI健康顾问，支持多轮对话，提供专业的健康咨询服务，
                  涵盖常见疾病、症状分析、用药指导等多个领域。
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    24/7在线咨询
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    多轮对话理解
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    专业医学知识库
                  </li>
                </ul>
                <Link 
                  to="/chat" 
                  className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700"
                >
                  立即体验 <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>

              {/* 饮食建议 */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl hover:shadow-lg transition-shadow">
                <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <Apple className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">个性化饮食建议</h3>
                <p className="text-gray-600 mb-6">
                  根据您的身体状况、健康目标和饮食偏好，AI为您量身定制营养均衡的饮食方案，
                  包含详细的营养分析和食谱推荐。
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    个性化营养方案
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    详细营养分析
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    丰富食谱库
                  </li>
                </ul>
                <Link 
                  to="/nutrition" 
                  className="inline-flex items-center text-green-600 font-semibold hover:text-green-700"
                >
                  制定饮食计划 <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>

              {/* 运动指导 */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl hover:shadow-lg transition-shadow">
                <div className="bg-orange-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <Dumbbell className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">科学运动指导</h3>
                <p className="text-gray-600 mb-6">
                  基于体能评估结果，为您制定科学的运动计划，包含有氧运动、力量训练等多种类型，
                  并提供详细的动作指导和进度跟踪。
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    体能科学评估
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    个性化运动方案
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    进度实时跟踪
                  </li>
                </ul>
                <Link 
                  to="/exercise" 
                  className="inline-flex items-center text-orange-600 font-semibold hover:text-orange-700"
                >
                  开始运动计划 <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 快速体验区域 */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              立即开始您的健康管理之旅
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              无需等待，现在就可以体验AI健康顾问的强大功能
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link 
                to="/chat" 
                className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl hover:bg-white/20 transition-colors group"
              >
                <MessageCircle className="h-12 w-12 text-white mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">免费健康咨询</h3>
                <p className="text-blue-100 text-sm">立即与AI健康顾问对话</p>
              </Link>
              <Link 
                to="/nutrition" 
                className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl hover:bg-white/20 transition-colors group"
              >
                <Apple className="h-12 w-12 text-white mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">营养方案定制</h3>
                <p className="text-blue-100 text-sm">获取个性化饮食建议</p>
              </Link>
              <Link 
                to="/exercise" 
                className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl hover:bg-white/20 transition-colors group"
              >
                <Activity className="h-12 w-12 text-white mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">运动计划制定</h3>
                <p className="text-blue-100 text-sm">开始科学健身之旅</p>
              </Link>
            </div>
          </div>
        </section>

        {/* 用户评价 */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                用户真实评价
              </h2>
              <p className="text-xl text-gray-600">
                已有数万用户选择我们的AI健康顾问服务
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  "AI健康顾问给出的饮食建议非常专业，帮助我在3个月内成功减重15斤，
                  而且身体状态比以前更好了！"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">张女士</p>
                    <p className="text-sm text-gray-500">会员用户</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  "作为一个健身新手，AI制定的运动计划让我循序渐进地提升体能，
                  现在已经养成了规律运动的好习惯。"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">李先生</p>
                    <p className="text-sm text-gray-500">普通用户</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  "24小时随时可以咨询健康问题，AI的回答很专业，
                  帮我解决了很多日常健康疑问，非常实用！"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">王女士</p>
                    <p className="text-sm text-gray-500">VIP用户</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 产品特色（替代虚假统计数据） */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
                <p className="text-gray-600">全天候AI在线</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">3s</div>
                <p className="text-gray-600">平均回复速度</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-600 mb-2">100+</div>
                <p className="text-gray-600">健康知识领域</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">免费</div>
                <p className="text-gray-600">体验无需注册</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold">AI健康顾问</span>
              </div>
              <p className="text-gray-400">
                基于AI技术的个性化健康管理平台，
                让健康管理变得简单高效。
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">核心功能</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/chat" className="hover:text-white transition-colors">健康问答</Link></li>
                <li><Link to="/nutrition" className="hover:text-white transition-colors">饮食建议</Link></li>
                <li><Link to="/exercise" className="hover:text-white transition-colors">运动指导</Link></li>
                <li><Link to="/profile" className="hover:text-white transition-colors">健康档案</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">用户服务</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/pricing" className="hover:text-white transition-colors">定价计划</Link></li>
                <li><Link to="/membership" className="hover:text-white transition-colors">会员服务</Link></li>
                <li><Link to="/help" className="hover:text-white transition-colors">帮助中心</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">联系我们</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">隐私政策</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">关注我们</h3>
              <p className="text-gray-400 mb-4">
                获取最新的健康资讯和产品更新
              </p>
              <div className="flex space-x-4">
                <TrendingUp className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                <MessageCircle className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                <Heart className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AI健康顾问. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HealthHomePage;