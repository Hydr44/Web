"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Save,
  X,
  Camera,
  Globe,
  Clock,
  Bell,
  Shield,
  CheckCircle,
  AlertTriangle,
  Database
} from "lucide-react";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [userData, setUserData] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    website: "",
    timezone: "Europe/Rome",
    language: "it",
    avatar_url: "",
    created_at: "",
    last_login: ""
  });

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    location: "",
    bio: "",
    website: "",
    timezone: "Europe/Rome",
    language: "it"
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const supabase = supabaseBrowser();
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error getting user:", userError);
          setLoading(false);
          return;
        }
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setUserData({
            full_name: profile.full_name || "",
            email: user.email || "",
            phone: profile.phone || "",
            location: profile.location || "",
            bio: profile.bio || "",
            website: profile.website || "",
            timezone: profile.timezone || "Europe/Rome",
            language: profile.language || "it",
            avatar_url: profile.avatar_url || "",
            created_at: profile.created_at || "",
            last_login: profile.last_login || ""
          });
          
          setFormData({
            full_name: profile.full_name || "",
            phone: profile.phone || "",
            location: profile.location || "",
            bio: profile.bio || "",
            website: profile.website || "",
            timezone: profile.timezone || "Europe/Rome",
            language: profile.language || "it"
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading user data:", error);
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleSave = async () => {
    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        return;
      }

      setUserData(prev => ({ ...prev, ...formData }));
      setEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: userData.full_name,
      phone: userData.phone,
      location: userData.location,
      bio: userData.bio,
      website: userData.website,
      timezone: userData.timezone,
      language: userData.language
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
          <User className="h-4 w-4" />
          Profilo Personale
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Il tuo <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">profilo</span>
            </h1>
            <p className="text-lg text-gray-600">
              Gestisci le tue informazioni personali e le preferenze dell'account.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {editing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  <X className="h-4 w-4" />
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200 font-medium"
                >
                  <Save className="h-4 w-4" />
                  Salva
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200 font-medium"
              >
                <Edit className="h-4 w-4" />
                Modifica
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {userData.full_name ? userData.full_name[0].toUpperCase() : userData.email[0].toUpperCase()}
                </div>
                {editing && (
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors duration-200">
                    <Camera className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {userData.full_name || "Nome non impostato"}
              </h2>
              <p className="text-sm text-gray-600 mb-4">{userData.email}</p>
              
              {userData.bio && (
                <p className="text-sm text-gray-700 mb-4">{userData.bio}</p>
              )}
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Membro dal {new Date(userData.created_at).toLocaleDateString('it-IT')}</span>
                </div>
                {userData.last_login && (
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Ultimo accesso: {new Date(userData.last_login).toLocaleDateString('it-IT')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Informazioni Personali</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                    placeholder="Il tuo nome completo"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                    {userData.full_name || "Non impostato"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  {userData.email}
                </div>
                <p className="text-xs text-gray-500 mt-1">L'email non può essere modificata</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefono
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                    placeholder="+39 123 456 7890"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    {userData.phone || "Non impostato"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Località
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                    placeholder="Milano, Italia"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    {userData.location || "Non impostato"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sito Web
                </label>
                {editing ? (
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                    placeholder="https://tuosito.com"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    {userData.website ? (
                      <a href={userData.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {userData.website}
                      </a>
                    ) : (
                      "Non impostato"
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuso Orario
                </label>
                {editing ? (
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                  >
                    <option value="Europe/Rome">Europa/Roma (GMT+1)</option>
                    <option value="Europe/London">Europa/Londra (GMT+0)</option>
                    <option value="America/New_York">America/New York (GMT-5)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                  </select>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    {userData.timezone}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biografia
              </label>
              {editing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                  placeholder="Raccontaci qualcosa di te..."
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 min-h-[100px]">
                  {userData.bio || "Nessuna biografia impostata"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
