import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ScrollView, ActivityIndicator, Image, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function AddEditProductScreen({ route, navigation }: any) {
  const { user } = useContext(AuthContext);
  const isEditing = !!route.params?.product;
  const product = route.params?.product || {};

  const [name, setName] = useState(product.name || '');
  const [price, setPrice] = useState(product.price ? product.price.toString() : '');
  const [stock, setStock] = useState(product.stock ? product.stock.toString() : '');
  const [description, setDescription] = useState(product.description || '');
  const [category, setCategory] = useState(product.category || 'Vegetables');
  const [imageUri, setImageUri] = useState<string | null>(product.image || null);
  const categories = ['Vegetables', 'Fruits', 'Grains', 'Livestock', 'Other'];
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // On web, use launchImageLibraryAsync directly (no permissions needed)
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library to pick a product image.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true, // Get base64 so we can store in Firestore directly
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      // Store as base64 data URI so it works without Firebase Storage
      const uri = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      setImageUri(uri);
    }
  };

  const handleSave = async () => {
    if (!name || !price || !stock) {
      Alert.alert('Error', 'Please fill in product name, price, and stock quantity.');
      return;
    }
    if (isNaN(parseFloat(price)) || isNaN(parseInt(stock))) {
      Alert.alert('Error', 'Price and stock must be valid numbers.');
      return;
    }
    setLoading(true);
    try {
      const data: any = {
        name,
        price: parseFloat(price),
        stock: parseInt(stock),
        description,
        category,
        farmerId: user?.id,
        farmer: user?.email,
        image: imageUri || 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600',
        updatedAt: new Date().toISOString(),
      };

      if (isEditing) {
        await updateDoc(doc(db, 'products', product.id), data);
        Alert.alert('✅ Updated', `${name} has been updated.`);
      } else {
        await addDoc(collection(db, 'products'), {
          ...data,
          createdAt: new Date().toISOString(),
        });
        Alert.alert('✅ Added', `${name} has been listed on the marketplace.`);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', 'Failed to save product: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Image Picker Section */}
      <Text style={styles.label}>Product Image</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <View style={styles.changeOverlay}>
              <Ionicons name="camera" size={22} color="#fff" />
              <Text style={styles.changeText}>Change Photo</Text>
            </View>
          </>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera-outline" size={48} color="#aaa" />
            <Text style={styles.imagePlaceholderText}>Tap to pick a photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Product Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Organic Tomatoes"
      />

      <Text style={styles.label}>Price (Leones) *</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        placeholder="e.g. 15.00"
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Stock Quantity *</Text>
      <TextInput
        style={styles.input}
        value={stock}
        onChangeText={setStock}
        placeholder="e.g. 50"
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Category *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
        {categories.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.catBtn, category === c && styles.catBtnSelected]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.catText, category === c && styles.catTextSelected]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Describe your product — quality, origin, freshness, etc."
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>
            {isEditing ? '✏️ Update Product' : '➕ Add to Marketplace'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  contentContainer: { padding: 20, paddingBottom: 50 },
  label: { fontSize: 15, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  imagePicker: {
    width: '100%', height: 200, borderRadius: 12, overflow: 'hidden',
    backgroundColor: '#e8e8e8', marginBottom: 20, position: 'relative',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed',
  },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  changeOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 8,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  changeText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center', gap: 8 },
  imagePlaceholderText: { color: '#aaa', fontSize: 14 },
  input: {
    backgroundColor: '#fff', padding: 14, borderRadius: 10,
    marginBottom: 18, borderWidth: 1, borderColor: '#ddd', fontSize: 15,
  },
  textArea: { height: 110, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: '#f57c00', padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  catBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#e0e0e0', marginRight: 10, alignSelf: 'flex-start',
  },
  catBtnSelected: { backgroundColor: '#f57c00' },
  catText: { color: '#555', fontWeight: 'bold' },
  catTextSelected: { color: '#fff' },
});
