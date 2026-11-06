import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Bot,
  User,
  Heart,
  ArrowLeft,
  MessageCircle,
  Loader2,
  Lightbulb,
  Clock,
  Star
} from 'lucide-react';
import { ChatMessage, ChatResponse } from '../types/health';
import { ApiClientError, getAiServiceStatus } from '../services/aiApiClient';
import { askHealthQuestion } from '../services/healthChatApi';

/**
 * AI健康问答页面组件
 * 提供智能健康咨询对话界面
 */
const HealthChatPage: React.FC = () => {
  const aiServiceStatus = getAiServiceStatus();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: '1',
      sessionId: 'demo-session',
      role: 'assistant',
      content: aiServiceStatus.configured
        ? '您好！我是您的AI健康顾问，很高兴为您服务。我可以帮助您解答各种健康问题，包括症状分析、营养建议、运动指导等。请告诉我您想了解什么？'
        : 'AI 服务尚未配置。您仍可查看本地内置的一般健康资料，页面会明确标注其为离线内容。',
      confidenceScore: aiServiceStatus.configured ? 1.0 : 0.0,
      createdAt: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 常见问题建议
  const commonQuestions = [
    '我最近总是感到疲劳，可能是什么原因？',
    '如何制定一个健康的减肥计划？',
    '每天应该喝多少水？',
    '什么运动适合初学者？',
    '如何改善睡眠质量？'
  ];

  /**
   * 滚动到消息底部（只滚动消息容器，不带动整个窗口）
   */
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({ top: container.scrollHeight, behavior });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    // 首次进入只有欢迎消息，无需滚动；其后有新消息 / 加载指示器时才滚到底
    if (messages.length > 1 || isLoading) scrollToBottom();
  }, [messages, isLoading]);

  /** 优先使用自有 API 端点；失败时只返回明确标注的离线规则资料。 */
  const simulateAIResponse = async (question: string): Promise<ChatResponse> => {
    try {
      return await askHealthQuestion(question);
    } catch (error) {
      console.warn(
        'AI 服务不可用:',
        error instanceof ApiClientError ? error.code : 'UNKNOWN_ERROR',
      );
      const fallbackResponse = getFallbackResponse(question);
      return {
        ...fallbackResponse,
        answer: `【离线规则资料】\n\nAI 服务未连接，以下内容来自本地固定资料，不是模型生成或个性化诊断。\n\n${fallbackResponse.answer}`,
        confidence: Math.min(fallbackResponse.confidence, 0.5),
      };
    }
  };

  /**
   * 降级方案：关键词匹配回复（无 API Key 时使用）
   */
  const getFallbackResponse = (question: string): ChatResponse => {
    let answer = '';
    let suggestions: string[] = [];

    if (question.includes('疲劳') || question.includes('累')) {
      answer = '感到疲劳可能有多种原因：\n\n1. **睡眠不足**：成年人每天需要7-9小时的优质睡眠\n2. **营养不均衡**：缺乏铁、维生素B12或维生素D\n3. **缺乏运动**：适度运动能提高能量水平\n4. **压力过大**：长期压力会消耗身体能量\n5. **潜在疾病**：如甲状腺功能减退、贫血等\n\n建议您保持规律作息，均衡饮食，适量运动。如果疲劳持续超过2周，建议咨询医生。';
      suggestions = ['如何改善睡眠质量？', '什么食物能补充能量？', '适合疲劳人群的运动有哪些？'];
    } else if (question.includes('减肥') || question.includes('瘦身')) {
      answer = '制定健康的减肥计划需要综合考虑：\n\n**饮食方面：**\n- 控制热量摄入，创造热量缺口\n- 增加蛋白质摄入，保持肌肉量\n- 多吃蔬菜水果，减少精制糖\n- 少食多餐，避免暴饮暴食\n\n**运动方面：**\n- 有氧运动：每周150分钟中等强度\n- 力量训练：每周2-3次\n- 循序渐进，避免过度运动\n\n**生活习惯：**\n- 充足睡眠，规律作息\n- 多喝水，少喝含糖饮料\n- 记录饮食和运动，监控进展\n\n健康减肥速度为每周0.5-1公斤。';
      suggestions = ['减肥期间可以吃什么零食？', '如何计算每日所需热量？', '减肥平台期怎么办？'];
    } else if (question.includes('水') || question.includes('喝水')) {
      answer = '每日饮水量建议：\n\n**一般成年人：**\n- 男性：约2.7升（11杯）\n- 女性：约2.2升（9杯）\n\n**需要增加饮水的情况：**\n- 运动出汗较多\n- 天气炎热或干燥\n- 发烧或生病时\n- 怀孕或哺乳期\n\n**饮水技巧：**\n- 起床后先喝一杯温水\n- 餐前30分钟喝水有助消化\n- 运动前中后及时补水\n- 可以通过尿液颜色判断水分状态\n\n记住，茶、咖啡、汤类也算在每日水分摄入中。';
      suggestions = ['什么时候喝水最好？', '喝太多水有害吗？', '如何判断身体缺水？'];
    } else if (question.includes('运动') || question.includes('健身')) {
      answer = '初学者运动建议：\n\n**有氧运动（每周3-4次）：**\n- 快走：每次30-45分钟\n- 慢跑：从15分钟开始逐渐增加\n- 游泳：全身运动，关节友好\n- 骑行：低冲击，适合膝盖敏感者\n\n**力量训练（每周2-3次）：**\n- 从自重训练开始：俯卧撑、深蹲、平板支撑\n- 使用轻重量哑铃\n- 每个动作8-12次，2-3组\n\n**注意事项：**\n- 运动前充分热身\n- 循序渐进，避免受伤\n- 运动后适当拉伸\n- 保持规律，持之以恒';
      suggestions = ['运动前后应该吃什么？', '如何制定运动计划？', '运动受伤了怎么办？'];
    } else if (question.includes('睡眠') || question.includes('失眠')) {
      answer = '改善睡眠质量的方法：\n\n**睡眠环境：**\n- 保持卧室安静、黑暗、凉爽\n- 使用舒适的床垫和枕头\n- 避免电子设备蓝光干扰\n\n**睡前习惯：**\n- 建立固定的睡前仪式\n- 睡前1小时避免剧烈运动\n- 可以洗热水澡、听轻音乐\n- 避免咖啡因和酒精\n\n**作息规律：**\n- 每天同一时间睡觉和起床\n- 即使周末也要保持规律\n- 白天适当接受阳光照射\n\n如果失眠持续超过3周，建议咨询医生。';
      suggestions = ['午睡多长时间合适？', '睡前可以吃东西吗？', '如何应对时差问题？'];
    } else {
      answer = '本地资料暂时没有覆盖这个问题。\n\n健康资料仅供一般参考，不能替代专业医疗诊断。如果您有严重的健康问题或症状持续不改善，请及时咨询医生。';
      suggestions = ['我想了解营养搭配', '如何预防常见疾病？', '制定个人健康计划'];
    }

    return {
      answer,
      confidence: 0.75,
      suggestions
    };
  };

  /**
   * 发送消息
   */
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sessionId: 'demo-session',
      role: 'user',
      content: inputMessage.trim(),
      confidenceScore: 1.0,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      const response = await simulateAIResponse(inputMessage);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sessionId: 'demo-session',
        role: 'assistant',
        content: response.answer,
        confidenceScore: response.confidence,
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('发送消息失败:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sessionId: 'demo-session',
        role: 'assistant',
        content: '抱歉，我现在无法回答您的问题。请稍后再试，或者联系我们的客服团队。',
        confidenceScore: 0.0,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理回车键发送
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * 点击建议问题
   */
  const handleSuggestionClick = (question: string) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  /**
   * 格式化时间显示
   */
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link 
                to="/" 
                className="flex items-center whitespace-nowrap text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                返回首页
              </Link>
              <div className="flex items-center space-x-2">
                <Heart className="h-6 w-6 text-blue-600" />
                <span className="whitespace-nowrap text-lg font-semibold text-gray-900">AI健康问答</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className={`w-2 h-2 rounded-full ${aiServiceStatus.configured ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
              <span>{aiServiceStatus.configured ? '接口地址已配置' : 'AI 服务未配置'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* 聊天区域 */}
          <div className="h-chat flex flex-col">
            {/* 消息列表 */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {/* 头像 */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-blue-600' 
                      : 'bg-gradient-to-r from-green-500 to-blue-500'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-6 w-6 text-white" />
                    ) : (
                      <Bot className="h-6 w-6 text-white" />
                    )}
                  </div>
                  
                  {/* 消息内容 */}
                  <div className={`flex-1 max-w-[80%] ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    <div className={`inline-block p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.role === 'assistant' && message.confidenceScore < 1 && (
                        <div className="mt-2 flex items-center text-xs opacity-70">
                          <Star className="h-3 w-3 mr-1" />
                          模型自评（未校准）: {Math.round(message.confidenceScore * 100)}%
                        </div>
                      )}
                    </div>
                    <div className={`mt-1 text-xs text-gray-500 flex items-center ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* 加载指示器 */}
              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block p-4 rounded-2xl bg-gray-100">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-gray-600">AI正在思考中...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* 输入区域 */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="请输入您的健康问题..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  aria-label="发送健康问题"
                  className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 常见问题建议 */}
        {messages.length <= 1 && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">常见健康问题</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {commonQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(question)}
                  className="text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors text-gray-700 hover:text-blue-700"
                >
                  <MessageCircle className="h-4 w-4 inline mr-2" />
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* 免责声明 */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">重要提示：</p>
              <p>
                AI健康顾问提供的建议仅供参考，不能替代专业医疗诊断和治疗。
                如果您有严重的健康问题或症状持续不改善，请及时咨询专业医生。
                紧急情况请立即拨打120急救电话。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthChatPage;
