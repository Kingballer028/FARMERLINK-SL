import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet,
  TextInput, ActivityIndicator, ScrollView, RefreshControl
} from 'react-native';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Product } from '../types';
import { CartContext } from '../context/CartContext';

export default function BuyerHomeScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc'>('newest');
  const categories = ['All', 'Vegetables', 'Fruits', 'Grains', 'Livestock', 'Other'];
  
  const { addToCart, cartCount } = useContext(CartContext);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Product[] = snapshot.docs
        .map(doc => ({ id: doc.id, ...(doc.data() as Omit<Product, 'id'>) }))
        .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setProducts(items);
      setLoading(false);
    }, (err) => {
      console.error('Error loading products:', err);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === 'All' || p.category === category;
    return matchesSearch && matchesCat;
  }).sort((a, b) => {
    if (sortBy === 'priceAsc') return a.price - b.price;
    if (sortBy === 'priceDesc') return b.price - a.price;
    return 0; // Default is 'newest', which is pre-sorted from Firestore
  });

  const toggleSort = () => {
    if (sortBy === 'newest') setSortBy('priceAsc');
    else if (sortBy === 'priceAsc') setSortBy('priceDesc');
    else setSortBy('newest');
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProductDetails', { product: item })}
    >
      <Image
        source={{
          uri: item.image || 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=300',
        }}
        style={styles.image}
      />
      <View style={styles.cardInfo}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.farmer} numberOfLines={1}>By: {item.farmer || 'Unknown'}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingText}>⭐ {(Math.random() * 2 + 3).toFixed(1)}</Text>
          <Text style={styles.reviewsText}>({Math.floor(Math.random() * 50 + 5)} reviews)</Text>
        </View>
        <Text style={styles.price}>Le {(item.price || 0).toFixed(2)}</Text>
        {item.stock !== undefined && (
          <Text style={styles.stock}>In stock: {item.stock}</Text>
        )}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => addToCart(item, 1)}
        >
          <Text style={styles.addBtnText}>+ Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search for fresh produce..."
        value={search}
        onChangeText={setSearch}
      />

      {/* Promotional Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>Fresh Harvest!</Text>
          <Text style={styles.bannerSubtitle}>Get 10% off your first order today.</Text>
        </View>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200' }}
          style={styles.bannerImage}
        />
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
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
      {/* Categories & Sorting Header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Featured Products</Text>
        <TouchableOpacity style={styles.sortBtn} onPress={toggleSort}>
          <Text style={styles.sortBtnText}>
            Sort: {sortBy === 'newest' ? 'Newest' : sortBy === 'priceAsc' ? 'Price: Low-High' : 'Price: High-Low'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          ListHeaderComponent={renderHeader}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2e7d32']} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {products.length === 0
                  ? 'No products available yet.\nCheck back soon!'
                  : 'No products match your filters.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 10, width: '100%', maxWidth: 1000, alignSelf: 'center' },
  searchInput: {
    backgroundColor: '#fff', padding: 12, borderRadius: 8,
    marginBottom: 15, borderWidth: 1, borderColor: '#ddd', fontSize: 15,
  },
  list: { paddingBottom: 20 },
  header: { paddingBottom: 10 },
  banner: {
    backgroundColor: '#e8f5e9', borderRadius: 12, padding: 15, marginBottom: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    overflow: 'hidden'
  },
  bannerTextContainer: { flex: 1, paddingRight: 10 },
  bannerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32', marginBottom: 5 },
  bannerSubtitle: { fontSize: 14, color: '#555' },
  bannerImage: { width: 80, height: 80, borderRadius: 40 },
  categories: { marginBottom: 15, paddingBottom: 5 },
  catBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#e0e0e0', marginRight: 10,
  },
  catBtnSelected: { backgroundColor: '#2e7d32' },
  catText: { color: '#555', fontWeight: 'bold' },
  catTextSelected: { color: '#fff' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  sortBtn: { backgroundColor: '#e0e0e0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  sortBtnText: { fontSize: 12, fontWeight: 'bold', color: '#555' },
  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, margin: 5,
    overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  image: { width: '100%', height: 130 },
  cardInfo: { padding: 10 },
  name: { fontSize: 15, fontWeight: 'bold', marginBottom: 3 },
  farmer: { fontSize: 11, color: '#888', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  ratingText: { fontSize: 12, fontWeight: 'bold', color: '#f57c00', marginRight: 4 },
  reviewsText: { fontSize: 11, color: '#aaa' },
  price: { fontSize: 15, color: '#2e7d32', fontWeight: 'bold', marginBottom: 3 },
  stock: { fontSize: 11, color: '#aaa', marginBottom: 8 },
  addBtn: {
    backgroundColor: '#e8f5e9', paddingVertical: 6, borderRadius: 6, alignItems: 'center',
  },
  addBtnText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 12 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#999', fontSize: 16, textAlign: 'center', lineHeight: 26 },
});
