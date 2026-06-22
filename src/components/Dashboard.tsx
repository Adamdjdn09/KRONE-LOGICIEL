import { Client, FileTemplate } from '../types';
import { FiUsers, FiFileText, FiLayers, FiTruck, FiArrowRight, FiPlus, FiZap, FiShield, FiClock } from 'react-icons/fi';
import { AppView } from '../types';

interface DashboardProps {
  clients: Client[];
  templates: FileTemplate[];
  onNavigate: (view: AppView) => void;
}

export default function Dashboard({ clients, templates, onNavigate }: DashboardProps) {
  const totalExpeditions = clients.reduce((sum, c) => sum + c.expeditions.length, 0);
  const recentClients = [...clients].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const stats = [
    { label: 'Clients', value: clients.length, icon: FiUsers, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-500/10', onClick: () => onNavigate('clients') },
    { label: 'Expéditions', value: totalExpeditions, icon: FiTruck, color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-500/10', onClick: () => onNavigate('clients') },
    { label: 'Templates', value: templates.length, icon: FiFileText, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-500/10', onClick: () => onNavigate('settings-fichiers') },
    { label: 'Page de garde', value: 1, icon: FiLayers, color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-500/10', onClick: () => onNavigate('settings-page-garde') },
  ];

  const quickActions = [
    { label: 'Nouveau client', icon: FiPlus, onClick: () => onNavigate('clients'), color: 'text-blue-400' },
    { label: 'Créer un template', icon: FiFileText, onClick: () => onNavigate('settings-fichiers'), color: 'text-purple-400' },
    { label: 'Variables', icon: FiZap, onClick: () => onNavigate('settings-variables'), color: 'text-amber-400' },
  ];

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 bg-gradient-to-br from-accent-400 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg shadow-accent-500/30">
            <span className="text-2xl font-bold text-krone-900">K</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Bienvenue sur <span className="gradient-text">KRONE</span></h1>
            <p className="text-krone-300">Votre plateforme de gestion commerciale</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className="card-hover card-shine bg-krone-800/80 backdrop-blur-sm rounded-2xl p-6 border border-krone-700/50 text-left group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bgColor} rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon size={22} className="text-white" />
                </div>
                <FiArrowRight className="text-krone-500 group-hover:text-accent-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-4xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-krone-300">{stat.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiZap className="text-accent-400" />
          Actions rapides
        </h2>
        <div className="flex gap-3 flex-wrap">
          {quickActions.map(action => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="flex items-center gap-2 px-5 py-3 bg-krone-800/60 hover:bg-krone-700/80 border border-krone-700/50 rounded-xl text-sm font-medium text-krone-200 hover:text-white transition-all hover:border-krone-600"
            >
              <action.icon size={16} className={action.color} />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <div className="bg-krone-800/60 backdrop-blur-sm rounded-2xl border border-krone-700/50 overflow-hidden">
          <div className="p-5 border-b border-krone-700/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FiClock className="text-krone-400" />
              Derniers clients
            </h2>
            <button onClick={() => onNavigate('clients')} className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1">
              Voir tout <FiArrowRight size={12} />
            </button>
          </div>
          <div className="p-4">
            {recentClients.length === 0 ? (
              <div className="text-center py-8">
                <FiUsers size={40} className="mx-auto text-krone-600 mb-3" />
                <p className="text-krone-400 text-sm">Aucun client créé</p>
                <button onClick={() => onNavigate('clients')} className="mt-3 text-sm text-accent-400 hover:text-accent-300">
                  Créer votre premier client
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentClients.map(client => (
                  <div key={client.id} className="flex items-center justify-between p-3 rounded-xl bg-krone-700/30 hover:bg-krone-700/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-krone-500 to-krone-600 rounded-lg flex items-center justify-center text-white font-semibold">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium group-hover:text-accent-400 transition-colors">{client.name}</p>
                        <p className="text-xs text-krone-400">{client.expeditions.length} expédition(s)</p>
                      </div>
                    </div>
                    <span className="text-xs text-krone-500">{new Date(client.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Templates */}
        <div className="bg-krone-800/60 backdrop-blur-sm rounded-2xl border border-krone-700/50 overflow-hidden">
          <div className="p-5 border-b border-krone-700/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FiFileText className="text-krone-400" />
              Templates de fichiers
            </h2>
            <button onClick={() => onNavigate('settings-fichiers')} className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1">
              Gérer <FiArrowRight size={12} />
            </button>
          </div>
          <div className="p-4">
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <FiFileText size={40} className="mx-auto text-krone-600 mb-3" />
                <p className="text-krone-400 text-sm">Aucun template créé</p>
                <button onClick={() => onNavigate('settings-fichiers')} className="mt-3 text-sm text-accent-400 hover:text-accent-300">
                  Créer votre premier template
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-krone-700/30 hover:bg-krone-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
                        <FiFileText size={18} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{t.name}</p>
                        <p className="text-xs text-krone-400 capitalize">{t.type}</p>
                      </div>
                    </div>
                    <span className="text-xs text-krone-500">{t.elements.length} éléments</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mt-8 p-6 bg-gradient-to-r from-krone-800/60 to-krone-700/40 backdrop-blur-sm rounded-2xl border border-krone-700/50">
        <div className="flex items-center gap-3 mb-4">
          <FiShield className="text-accent-400" size={20} />
          <h3 className="font-semibold text-white">Fonctionnalités KRONE</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-krone-800/40">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiLayers size={16} className="text-blue-400" />
            </div>
            <div>
              <p className="text-white font-medium mb-1">Page de garde personnalisable</p>
              <p className="text-krone-400 text-xs">Structurez vos informations selon vos besoins</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-krone-800/40">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiFileText size={16} className="text-purple-400" />
            </div>
            <div>
              <p className="text-white font-medium mb-1">Templates professionnels</p>
              <p className="text-krone-400 text-xs">Créez des documents avec éditeur visuel</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-krone-800/40">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiZap size={16} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-medium mb-1">Variables dynamiques</p>
              <p className="text-krone-400 text-xs">Automatisez vos documents avec des variables</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
