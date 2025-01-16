import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Send, RefreshCw, Upload, Plus, X, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { AdminNav } from '../components/AdminNav';

interface Settings {
  id: string;
  about_text: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta: string;
  logo_url: string | null;
  about_short: string;
  email_settings: {
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_password: string;
    smtp_from_email: string;
    smtp_from_name: string;
    order_confirmation_subject: string;
    order_confirmation_template: string;
    registration_subject: string;
    registration_template: string;
  };
}

interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  attempts: number;
  created_at: string;
  sent_at: string | null;
  error: string | null;
}

interface AboutImage {
  id: string;
  url: string;
  order: number;
}

export function Settings() {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [aboutImages, setAboutImages] = useState<AboutImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'branding' | 'homepage' | 'about' | 'email' | 'templates'>('email');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .single();

        if (settingsError) throw settingsError;
        if (settingsData) setSettings(settingsData);

        // Fetch email logs
        const { data: logsData, error: logsError } = await supabase
          .from('email_queue')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (logsError) throw logsError;
        if (logsData) setEmailLogs(logsData);

        // Fetch about images
        const { data: imagesData, error: imagesError } = await supabase
          .from('about_images')
          .select('*')
          .order('order');

        if (imagesError) throw imagesError;
        if (imagesData) setAboutImages(imagesData);

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Fehler beim Laden der Daten');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, navigate]);

  const handleSaveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const { error } = await supabase
        .from('settings')
        .update(settings)
        .eq('id', settings.id);

      if (error) throw error;
      setSuccessMessage('Einstellungen wurden gespeichert');
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Fehler beim Speichern der Einstellungen');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProcessEmails = async () => {
    setIsProcessing(true);
    setError('');
    setSuccessMessage('');

    try {
      const { error } = await supabase.rpc('manual_trigger_email_queue');
      if (error) throw error;
      
      setSuccessMessage('E-Mail-Verarbeitung wurde gestartet');
      
      // Refresh logs after a short delay
      setTimeout(async () => {
        const { data, error: logsError } = await supabase
          .from('email_queue')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (logsError) throw logsError;
        if (data) setEmailLogs(data);
      }, 2000);
    } catch (error) {
      console.error('Error processing emails:', error);
      setError('Fehler beim Verarbeiten der E-Mails');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      setError('Bitte geben Sie eine Test-E-Mail-Adresse ein');
      return;
    }

    setIsSendingTest(true);
    setError('');
    setSuccessMessage('');

    try {
      const { error: insertError } = await supabase
        .from('email_queue')
        .insert({
          to_email: testEmail,
          subject: 'Test E-Mail von Johanna Lederwaren',
          body: 'Dies ist eine Test-E-Mail um die E-Mail-Einstellungen zu überprüfen.',
          metadata: { type: 'test_email' }
        });

      if (insertError) throw insertError;

      setSuccessMessage('Test-E-Mail wurde in die Warteschlange eingereiht');
      setTestEmail('');
      await handleProcessEmails();
    } catch (error) {
      console.error('Error sending test email:', error);
      setError('Fehler beim Senden der Test-E-Mail');
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    setIsUploading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      // Update settings with new logo URL
      if (settings) {
        const { error: updateError } = await supabase
          .from('settings')
          .update({ logo_url: publicUrl })
          .eq('id', settings.id);

        if (updateError) throw updateError;

        setSettings({ ...settings, logo_url: publicUrl });
        setSuccessMessage('Logo wurde erfolgreich hochgeladen');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setError('Fehler beim Hochladen des Logos');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    setError('');
    setSuccessMessage('');

    try {
      const files = Array.from(e.target.files);
      const maxOrder = Math.max(...aboutImages.map(img => img.order), 0);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `about-${Date.now()}-${i}.${fileExt}`;

        // Upload file
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);

        // Create image record
        const { data: imageData, error: insertError } = await supabase
          .from('about_images')
          .insert({
            url: publicUrl,
            order: maxOrder + i + 1
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (imageData) {
          setAboutImages(prev => [...prev, imageData]);
        }
      }

      setSuccessMessage('Bilder wurden erfolgreich hochgeladen');
    } catch (error) {
      console.error('Error uploading images:', error);
      setError('Fehler beim Hochladen der Bilder');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDelete = async (id: string) => {
    if (!window.confirm('Möchten Sie dieses Bild wirklich löschen?')) return;

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const { error } = await supabase
        .from('about_images')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAboutImages(prev => prev.filter(img => img.id !== id));
      setSuccessMessage('Bild wurde gelöscht');
    } catch (error) {
      console.error('Error deleting image:', error);
      setError('Fehler beim Löschen des Bildes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageReorder = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = aboutImages.findIndex(img => img.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === aboutImages.length - 1)
    ) return;

    const newImages = [...aboutImages];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    [newImages[currentIndex], newImages[targetIndex]] = [newImages[targetIndex], newImages[currentIndex]];

    // Update order values
    newImages.forEach((img, index) => {
      img.order = index;
    });

    setAboutImages(newImages);

    try {
      await Promise.all(
        newImages.map(img =>
          supabase
            .from('about_images')
            .update({ order: img.order })
            .eq('id', img.id)
        )
      );
    } catch (error) {
      console.error('Error reordering images:', error);
      setError('Fehler beim Neuordnen der Bilder');
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-burgundy-50 relative">
      {(isLoading || isSaving || isProcessing || isSendingTest || isUploading) && <LoadingOverlay />}
      
      <AdminNav onLogout={() => navigate('/login')} />

      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-typewriter text-burgundy-900">Einstellungen</h1>
          <div className="flex items-center gap-4">
            {error && (
              <span className="text-red-600">{error}</span>
            )}
            {successMessage && (
              <span className="text-green-600">{successMessage}</span>
            )}
            {activeTab === 'email' && (
              <button
                onClick={handleProcessEmails}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-3 bg-burgundy-700 text-white rounded-lg hover:bg-burgundy-800 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
                E-Mails verarbeiten
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {(['branding', 'homepage', 'about', 'email', 'templates'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === tab
                  ? 'bg-burgundy-700 text-white'
                  : 'bg-white text-burgundy-700 hover:bg-burgundy-50'
              }`}
            >
              {tab === 'branding' && 'Logo & Branding'}
              {tab === 'homepage' && 'Startseite'}
              {tab === 'about' && 'Über mich'}
              {tab === 'email' && 'E-Mail-Einstellungen'}
              {tab === 'templates' && 'E-Mail-Vorlagen'}
            </button>
          ))}
        </div>

        {/* Branding Tab */}
        {activeTab === 'branding' && settings && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-medium text-burgundy-900 mb-6">Logo</h2>
            
            <div className="space-y-6">
              {settings.logo_url && (
                <div className="w-32 h-32 relative">
                  <img
                    src={settings.logo_url}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo hochladen
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-burgundy-50 file:text-burgundy-700
                    hover:file:bg-burgundy-100"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Empfohlene Größe: 512x512 Pixel, transparenter Hintergrund
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Homepage Tab */}
        {activeTab === 'homepage' && settings && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-medium text-burgundy-900 mb-6">Hero-Bereich</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Überschrift
                  </label>
                  <input
                    type="text"
                    value={settings.hero_title}
                    onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Untertitel
                  </label>
                  <textarea
                    value={settings.hero_subtitle}
                    onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button-Text
                  </label>
                  <input
                    type="text"
                    value={settings.hero_cta}
                    onChange={(e) => setSettings({ ...settings, hero_cta: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kurzbeschreibung
                  </label>
                  <textarea
                    value={settings.about_short}
                    onChange={(e) => setSettings({ ...settings, about_short: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-burgundy-700 text-white rounded-lg hover:bg-burgundy-800 transition disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    Speichern
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && settings && (
          <div className="space-y-8">
            {/* About Text */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-medium text-burgundy-900 mb-6">Über mich Text</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Haupttext
                  </label>
                  <textarea
                    value={settings.about_text}
                    onChange={(e) => setSettings({ ...settings, about_text: e.target.value })}
                    rows={15}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Verwenden Sie eine leere Zeile für neue Absätze.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-burgundy-700 text-white rounded-lg hover:bg-burgundy-800 transition disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    Speichern
                  </button>
                </div>
              </div>
            </div>

            {/* About Images */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-medium text-burgundy-900 mb-6">Bilder</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {aboutImages.map((image, index) => (
                    <div key={image.id} className="relative group aspect-square">
                      <img
                        src={image.url}
                        alt={`Bild ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleImageReorder(image.id, 'up')}
                          className="p-2 rounded-full bg-white text-gray-800 hover:bg-burgundy-600 hover:text-white transition-colors disabled:opacity-50"
                          disabled={index === 0}
                          title="Nach oben"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleImageReorder(image.id, 'down')}
                          className="p-2 rounded-full bg-white text-gray-800 hover:bg-burgundy-600 hover:text-white transition-colors disabled:opacity-50"
                          disabled={index === aboutImages.length - 1}
                          title="Nach unten"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleImageDelete(image.id)}
                          className="p-2 rounded-full bg-white text-gray-800 hover:bg-red-600 hover:text-white transition-colors"
                          title="Bild löschen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {aboutImages.length < 6 && (
                    <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-burgundy-500 transition-colors cursor-pointer flex items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="text-center">
                        <Plus className="mx-auto h-12 w-12 text-gray-400" />
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Bilder hinzufügen
                        </span>
                      </div>
                    </label>
                  )}
                </div>

                <p className="text-sm text-gray-500">
                  Maximal 6 Bilder. Empfohlene Größe: mindestens 1200x800 Pixel.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Email Settings Tab */}
        {activeTab === 'email' && settings && (
          <div className="space-y-8">
            {/* SMTP Settings */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-medium text-burgundy-900 mb-6">SMTP-Einstellungen</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={settings.email_settings.smtp_host}
                    onChange={(e) => setSettings({
                      ...settings,
                      email_settings: {
                        ...settings.email_settings,
                        smtp_host: e.target.value
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={settings.email_settings.smtp_port}
                    onChange={(e) => setSettings({
                      ...settings,
                      email_settings: {
                        ...settings.email_settings,
                        smtp_port: parseInt(e.target.value)
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Benutzer
                  </label>
                  <input
                    type="text"
                    value={settings.email_settings.smtp_user}
                    onChange={(e) => setSettings({
                      ...settings,
                      email_settings: {
                        ...settings.email_settings,
                        smtp_user: e.target.value
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Passwort
                  </label>
                  <input
                    type="password"
                    value={settings.email_settings.smtp_password}
                    onChange={(e) => setSettings({
                      ...settings,
                      email_settings: {
                        ...settings.email_settings,
                        smtp_password: e.target.value
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Absender E-Mail
                  </label>
                  <input
                    type="email"
                    value={settings.email_settings.smtp_from_email}
                    onChange={(e) => setSettings({
                      ...settings,
                      email_settings: {
                        ...settings.email_settings,
                        smtp_from_email: e.target.value
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Absender Name
                  </label>
                  <input
                    type="text"
                    value={settings.email_settings.smtp_from_name}
                    onChange={(e) => setSettings({
                      ...settings,
                      email_settings: {
                        ...settings.email_settings,
                        smtp_from_name: e.target.value
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-burgundy-700 text-white rounded-lg hover:bg-burgundy-800 transition disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  Speichern
                </button>
              </div>
            </div>

            {/* Test Email Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-medium text-burgundy-900 mb-6">E-Mail-Test</h2>
              
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Test-E-Mail senden an
                  </label>
                  <input
                    type="email"
                    id="testEmail"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="email@beispiel.de"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>
                <button
                  onClick={handleSendTestEmail}
                  disabled={isSendingTest || !testEmail}
                  className="flex items-center gap-2 px-6 py-2 bg-burgundy-700 text-white rounded-lg hover:bg-burgundy-800 transition disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                  Test senden
                </button>
              </div>
            </div>

            {/* Email Logs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-medium text-burgundy-900 mb-6">E-Mail-Protokoll</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empfänger</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betreff</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Versuche</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Erstellt</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gesendet</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fehler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {emailLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.to_email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.subject}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            log.status === 'sent' ? 'bg-green-100 text-green-800' :
                            log.status === 'failed' ? 'bg-red-100 text-red-800' :
                            log.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {log.status === 'sent' ? 'Gesendet' :
                             log.status === 'failed' ? 'Fehlgeschlagen' :
                             log.status === 'processing' ? 'Wird verarbeitet' :
                             'Ausstehend'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.attempts}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleString('de-DE')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.sent_at ? new Date(log.sent_at).toLocaleString('de-DE') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {log.error || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Email Templates Tab */}
        {activeTab === 'templates' && settings && (
          <div className="space-y-8">
            {/* Order Confirmation Template */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-medium text-burgundy-900 mb-6">Bestellbestätigung</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Betreff
                  </label>
                  <input
                    type="text"
                    value={settings.email_settings.order_confirmation_subject}
                    onChange={(e) => setSettings({
                      ...settings,
                      email_settings: {
                        ...settings.email_settings,
                        order_confirmation_subject: e.target.value
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-Mail-Text
                  </label>
                  <textarea
                    value={settings.email_settings.order_confirmation_template}
                    onChange={(e) => setSettings({
                      ...settings,
                      email_settings: {
                        ...settings.email_settings,
                        order_confirmation_template: e.target.value
                      }
                    })}
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Verfügbare Platzhalter: {'{customer_name}'}, {'{order_id}'}, {'{order_date}'}, {'{order_items}'}, {'{total_amount}'}, {'{shipping_address}'}
                  </p>
                </div>
              </div>
            </div>

            {/* Registration Template */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-medium text-burgundy-900 mb-6">Registrierungsbestätigung</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Betreff
                  </label>
                  <input
                    type="text"
                    value={settings.email_settings.registration_subject}
                    onChange={(e) => setSettings({
                      ...settings,
                      email_settings: {
                        ...settings.email_settings,
                        registration_subject: e.target.value
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-Mail-Text
                  </label>
                  <textarea
                    value={settings.email_settings.registration_template}
                    onChange={(e) => setSettings({
                      ...settings,
                      email_settings: {
                        ...settings.email_settings,
                        registration_template: e.target.value
                      }
                    })}
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-burgundy-500 focus:border-burgundy-500"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Verfügbare Platzhalter: {'{customer_name}'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
