import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Server, Bell, Shield, Save, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getAiServiceStatus } from '@/services/aiApiClient';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'service' | 'notifications'>('profile');
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({ name: '', age: '', height: '', weight: '', goals: '' });
  const aiServiceStatus = getAiServiceStatus();

  useEffect(() => {
    const saved = localStorage.getItem('health_profile');
    if (saved) setProfile(JSON.parse(saved));
  }, []);

  const saveProfile = () => {
    localStorage.setItem('health_profile', JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'profile' as const, label: '健康档案', icon: User },
    { id: 'service' as const, label: 'AI 服务', icon: Server },
    { id: 'notifications' as const, label: '通知设置', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center text-gray-600 hover:text-blue-600">
              <ArrowLeft className="h-5 w-5 mr-1" /> 返回首页
            </Link>
            <span className="text-lg font-semibold">设置</span>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8 bg-white p-1 rounded-lg shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'service' && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><Server className="h-5 w-5" /> AI 服务状态</h3>
              <div className="space-y-4">
                <div className={aiServiceStatus.configured
                  ? 'bg-green-50 p-4 rounded-lg text-sm text-green-800'
                  : 'bg-amber-50 p-4 rounded-lg text-sm text-amber-800'}>
                  <strong>{aiServiceStatus.configured ? '端点已配置' : '端点未配置'}</strong>
                  <p className="mt-2">{aiServiceStatus.message}</p>
                </div>
                <div className="text-sm text-gray-500">
                  <Shield className="h-4 w-4 inline mr-1" /> 供应商密钥由自有服务端保管，浏览器不保存或传输密钥。
                </div>
                {!aiServiceStatus.configured && (
                  <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                    AI 服务启用前，对话页只会显示明确标注的离线健康资料。
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'profile' && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><User className="h-5 w-5" /> 健康档案</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg" placeholder="你的昵称" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年龄</label>
                  <input type="number" value={profile.age} onChange={(e) => setProfile({...profile, age: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg" placeholder="25" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">身高 (cm)</label>
                  <input type="number" value={profile.height} onChange={(e) => setProfile({...profile, height: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg" placeholder="170" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">体重 (kg)</label>
                  <input type="number" value={profile.weight} onChange={(e) => setProfile({...profile, weight: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg" placeholder="65" />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">健康目标</label>
                <textarea value={profile.goals} onChange={(e) => setProfile({...profile, goals: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg h-24" placeholder="例如：减重5kg、改善睡眠、增强体能" />
              </div>
              <Button variant="primary" onClick={saveProfile}>
                {saved ? <><Check className="mr-2 h-4 w-4" /> 已保存</> : <><Save className="mr-2 h-4 w-4" /> 保存档案</>}
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'notifications' && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><Bell className="h-5 w-5" /> 通知设置</h3>
              <p className="text-gray-600 mb-4">自定义提醒和通知偏好（功能开发中）</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div><div className="font-medium">每日健康提醒</div><div className="text-sm text-gray-500">每天定时提醒记录健康状态</div></div>
                  <div className="text-gray-400 text-sm">即将上线</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div><div className="font-medium">饮水提醒</div><div className="text-sm text-gray-500">每2小时提醒喝水</div></div>
                  <div className="text-gray-400 text-sm">即将上线</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div><div className="font-medium">运动提醒</div><div className="text-sm text-gray-500">根据计划提醒运动时间</div></div>
                  <div className="text-gray-400 text-sm">即将上线</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
