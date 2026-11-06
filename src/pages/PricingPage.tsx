import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Star, ArrowRight, Gift, Crown, Zap, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PlanFeature { text: string; included: boolean; }
interface PricingPlan {
  name: string; price: number; originalPrice?: number; period: string;
  description: string; icon: React.ReactNode; color: string; bgColor: string;
  borderColor: string; cta: string; ctaVariant: 'primary' | 'secondary' | 'outline';
  features: PlanFeature[]; popular?: boolean;
}

const plans: PricingPlan[] = [
  {
    name: '免费版', price: 0, period: '永久免费',
    description: '基础健康咨询，了解AI健康顾问',
    icon: <Gift className="h-6 w-6" />, color: 'text-gray-600', bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200', cta: '免费开始', ctaVariant: 'outline',
    features: [
      { text: '每日5次健康问答', included: true },
      { text: '基础营养知识库', included: true },
      { text: '通用运动建议', included: true },
      { text: '健康小贴士', included: true },
      { text: '个性化饮食方案', included: false },
      { text: '定制运动计划', included: false },
      { text: '健康报告', included: false },
    ],
  },
  {
    name: '会员版', price: 29, period: '/月',
    description: '个性化健康方案，AI深度分析',
    icon: <Zap className="h-6 w-6" />, color: 'text-blue-600', bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300', cta: '立即订阅', ctaVariant: 'secondary',
    popular: true,
    features: [
      { text: '无限次健康问答', included: true },
      { text: '个性化饮食方案', included: true },
      { text: '定制运动计划', included: true },
      { text: '健康档案记录', included: true },
      { text: '每周健康报告', included: true },
      { text: '饮食热量计算器', included: true },
      { text: '专家在线咨询', included: false },
    ],
  },
  {
    name: 'VIP版', price: 99, period: '/月',
    description: '全方位健康管理+专家咨询',
    icon: <Crown className="h-6 w-6" />, color: 'text-amber-600', bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300', cta: '开通VIP', ctaVariant: 'primary',
    features: [
      { text: '无限次健康问答', included: true },
      { text: '个性化饮食方案', included: true },
      { text: '定制运动计划', included: true },
      { text: '健康档案+趋势分析', included: true },
      { text: '每日健康报告', included: true },
      { text: '专家在线咨询', included: true },
      { text: '家庭成员管理', included: true },
    ],
  },
];

const faqs = [
  { q: '免费版每天能问多少次？', a: '免费版每天提供5次健康问答，足够了解产品核心价值。如需更多次数，可升级到会员版。' },
  { q: 'AI健康顾问的建议靠谱吗？', a: '我们的AI基于权威医学知识训练，提供科学、实用的健康建议。但请注意，AI建议不能替代专业医疗诊断。' },
  { q: '可以随时取消订阅吗？', a: '可以。随时取消，取消后当前计费周期内仍可使用所有功能。' },
];

export const PricingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <section className="bg-gradient-to-r from-blue-600 to-green-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">选择你的健康计划</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">科学健康管理，从一次对话开始</p>
        </div>
      </section>
      <section className="py-16 -mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card key={plan.name} className={`relative ${plan.borderColor} ${plan.popular ? 'ring-2 ring-amber-400 shadow-xl scale-105' : 'shadow-md'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-500 text-white text-sm font-semibold px-4 py-1 rounded-full flex items-center gap-1">
                      <Star className="h-4 w-4" /> 最受欢迎
                    </span>
                  </div>
                )}
                <CardContent className="p-8">
                  <div className={`inline-flex p-3 rounded-lg ${plan.bgColor} ${plan.color} mb-4`}>{plan.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">¥{plan.price}</span>
                    <span className="text-gray-500 ml-1">{plan.period}</span>
                    {plan.originalPrice && <span className="text-gray-400 line-through ml-2">¥{plan.originalPrice}</span>}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${f.included ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={f.included ? 'text-gray-700' : 'text-gray-400'}>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant={plan.ctaVariant} className="w-full">{plan.cta}<ArrowRight className="ml-2 h-4 w-4" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">常见问题</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-gray-50 rounded-lg overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-gray-100">
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  <span className="text-gray-400">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && <div className="px-6 pb-4 text-gray-600">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Heart className="h-12 w-12 text-white mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">免费开始你的健康之旅</h2>
          <p className="text-xl text-blue-100 mb-8">无需信用卡，无需注册，立即体验AI健康顾问</p>
          <Link to="/chat">
            <Button variant="primary" className="bg-white text-blue-700 hover:bg-gray-100">开始免费体验 <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
