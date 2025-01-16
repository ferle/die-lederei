import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImagePlus, X, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { AdminNav } from '../components/AdminNav';

interface ProductImage {
  id: string;
  url: string;
  is_default: boolean;
  order: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  article_number: string;
  images: ProductImage[];
}

interface PendingImage {
  file: File;
  preview: string;
}

export function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [product, setProduct] = useState<Product>({
    id: '',
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    article_number: '',
    images: []
  });
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [categoriesResponse, productResponse, imagesResponse] = await Promise.all([
          supabase.from('categories').select('id, name'),
          id !== 'new' ? supabase.from('products').select('*').eq('id', id).single() : null,
          id !== 'new' ? supabase.from('product_images').select('*').eq('product_id', id).order('order') : null
        ]);

        if (categoriesResponse.data) {
          setCategories(categoriesResponse.data);
        }

        if (productResponse?.data) {
          setProduct({
            ...productResponse.data,
            images: imagesResponse?.data || []
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Fehler beim Laden der Daten');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isAdmin]);

  const uploadImages = async (productId: string, pendingImages: PendingImage[]) => {
    for (let i = 0; i < pendingImages.length; i++) {
      const { file } = pendingImages[i];
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}-${Date.now()}-${Math.random()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      // Create image record
      const { data: imageData, error: imageError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          url: publicUrl,
          is_default: i === 0 && product.images.length === 0,
          order: product.images.length + i
        })
        .select()
        .single();

      if (imageError) throw imageError;

      if (imageData) {
        setProduct(prev => ({
          ...prev,
          images: [...prev.images, imageData]
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const productData = {
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category
      };

      let productId = id;

      if (id === 'new') {
        // Generate a new article number for new products
        const { data: maxArticleNumber } = await supabase
          .from('products')
          .select('article_number')
          .order('article_number', { ascending: false })
          .limit(1)
          .single();

        const nextArticleNumber = maxArticleNumber 
          ? (parseInt(maxArticleNumber.article_number) + 1).toString()
          : '1000';

        const { data, error } = await supabase
          .from('products')
          .insert({ ...productData, article_number: nextArticleNumber })
          .select()
          .single();

        if (error) throw error;
        if (!data) throw new Error('Failed to create product');

        productId = data.id;

        // Upload pending images if any
        if (pendingImages.length > 0) {
          await uploadImages(productId, pendingImages);
        }

        navigate(`/admin/product/${productId}`);
      } else {
        await supabase
          .from('products')
          .update(productData)
          .eq('id', id);

        navigate('/admin/products');
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      setError(error.message || 'Fehler beim Speichern des Produkts');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate files
    const validFiles: PendingImage[] = [];
    const maxFiles = 5 - product.images.length - pendingImages.length;
    
    for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Nur Bilddateien sind erlaubt');
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Maximale Dateigröße: 5MB');
        continue;
      }

      validFiles.push({
        file,
        preview: URL.createObjectURL(file)
      });
    }

    if (id === 'new') {
      // Store files to upload after product creation
      setPendingImages(prev => [...prev, ...validFiles]);
    } else {
      // Upload files immediately for existing products
      setIsLoading(true);
      uploadImages(id, validFiles)
        .catch(error => {
          console.error('Error uploading images:', error);
          setError('Fehler beim Hochladen der Bilder');
        })
        .finally(() => setIsLoading(false));
    }
  };

  const handleRemovePendingImage = (index: number) => {
    setPendingImages(prev => {
      const newPending = [...prev];
      URL.revokeObjectURL(newPending[index].preview);
      newPending.splice(index, 1);
      return newPending;
    });
  };

  const handleRemoveImage = async (imageId: string) => {
    if (!window.confirm('Möchten Sie dieses Bild wirklich löschen?')) return;

    setIsLoading(true);
    setError('');

    try {
      await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      setProduct(prev => ({
        ...prev,
        images: prev.images.filter(img => img.id !== imageId)
      }));
    } catch (error) {
      console.error('Error removing image:', error);
      setError('Fehler beim Löschen des Bildes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefaultImage = async (imageId: string) => {
    setIsLoading(true);
    setError('');

    try {
      await supabase
        .from('product_images')
        .update({ is_default: false })
        .eq('product_id', id);

      await supabase
        .from('product_images')
        .update({ is_default: true })
        .eq('id', imageId);

      setProduct(prev => ({
        ...prev,
        images: prev.images.map(img => ({
          ...img,
          is_default: img.id === imageId
        }))
      }));
    } catch (error) {
      console.error('Error setting default image:', error);
      setError('Fehler beim Setzen des Standardbildes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorderImage = async (imageId: string, direction: 'up' | 'down') => {
    const currentIndex = product.images.findIndex(img => img.id === imageId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === product.images.length - 1)
    ) return;

    const newImages = [...product.images];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    [newImages[currentIndex], newImages[targetIndex]] = [newImages[targetIndex], newImages[currentIndex]];

    setProduct(prev => ({ ...prev, images: newImages }));

    try {
      await Promise.all(
        newImages.map((img, index) =>
          supabase
            .from('product_images')
            .update({ order: index })
            .eq('id', img.id)
        )
      );
    } catch (error) {
      console.error('Error reordering images:', error);
      setError('Fehler beim Neuordnen der Bilder');
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-burgundy-50 relative">
      {(isLoading || isSaving) && <LoadingOverlay />}
      
      <AdminNav onLogout={() => navigate('/login')} />

      <div className="max-w-4xl mx-auto py-12 px-6">
        <h1 className="text-3xl font-typewriter text-burgundy-900 mb-8">
          {id === 'new' ? 'Neues Produkt' : 'Produkt bearbeiten'}
        </h1>

        {error && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Images */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Produktbilder ({product.images.length}/5)
                {id === 'new' && pendingImages.length > 0 && ` + ${pendingImages.length} ausgewählt`}
              </label>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {product.images.map((image, index) => (
                  <div key={image.id} className="relative group aspect-square">
                    <img
                      src={image.url}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetDefaultImage(image.id)}
                        className={`p-2 rounded-full ${
                          image.is_default
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-gray-800'
                        } hover:bg-green-600 hover:text-white transition-colors`}
                        title={image.is_default ? 'Standardbild' : 'Als Standard festlegen'}
                      >
                        ★
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorderImage(image.id, 'up')}
                        className="p-2 rounded-full bg-white text-gray-800 hover:bg-burgundy-600 hover:text-white transition-colors disabled:opacity-50"
                        disabled={index === 0}
                        title="Nach oben"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorderImage(image.id, 'down')}
                        className="p-2 rounded-full bg-white text-gray-800 hover:bg-burgundy-600 hover:text-white transition-colors disabled:opacity-50"
                        disabled={index === product.images.length - 1}
                        title="Nach unten"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(image.id)}
                        className="p-2 rounded-full bg-white text-gray-800 hover:bg-red-600 hover:text-white transition-colors"
                        title="Bild löschen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Pending Images Preview */}
                {id === 'new' && pendingImages.map((pending, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={pending.preview}
                      alt={`Auswahl ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemovePendingImage(index)}
                        className="p-2 rounded-full bg-white text-gray-800 hover:bg-red-600 hover:text-white transition-colors"
                        title="Auswahl entfernen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {product.images.length + pendingImages.length < 5 && (
                  <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-burgundy-500 transition-colors cursor-pointer flex items-center justify-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center">
                      <ImagePlus className="mx-auto h-12 w-12 text-gray-400" />
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Bilder hinzufügen
                      </span>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* Article Number */}
            {id !== 'new' && (
              <div>
                <label htmlFor="article_number" className="block text-sm font-medium text-gray-700">
                  Artikelnummer
                </label>
                <input
                  type="text"
                  id="article_number"
                  value={product.article_number}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-burgundy-500 focus:ring-burgundy-500"
                />
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-burgundy-500 focus:ring-burgundy-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Beschreibung
              </label>
              <textarea
                id="description"
                value={product.description}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-burgundy-500 focus:ring-burgundy-500"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Preis (in Cent)
              </label>
              <input
                type="number"
                id="price"
                value={product.price}
                onChange={(e) => setProduct({ ...product, price: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-burgundy-500 focus:ring-burgundy-500"
                required
              />
            </div>

            {/* Stock */}
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                Lagerbestand
              </label>
              <input
                type="number"
                id="stock"
                value={product.stock}
                onChange={(e) => setProduct({ ...product, stock: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-burgundy-500 focus:ring-burgundy-500"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Kategorie
              </label>
              <select
                id="category"
                value={product.category}
                onChange={(e) => setProduct({ ...product, category: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-burgundy-500 focus:ring-burgundy-500"
                required
              >
                <option value="">Kategorie wählen</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name.toLowerCase()}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-burgundy-500"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-burgundy-600 hover:bg-burgundy-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-burgundy-500 disabled:opacity-50"
            >
              {isSaving ? 'Wird gespeichert...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}