import React, { useContext } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { CartContext } from '../context/CartContext';

export default function ProductDetailsScreen({ route, navigation }: any) {
  const { product } = route.params;
  const { addToCart } = useContext(CartContext);

  const handleAddToCart = () => {
    addToCart(product, 1);
    Alert.alert('✅ Added to Cart', `${product.name} has been added to your cart.`, [
      { text: 'Keep Shopping', style: 'cancel' },
      { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{
          uri: product.image || 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600',
        }}
        style={styles.image}
      />
      <View style={styles.detailsContainer}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>Le {(product.price || 0).toFixed(2)}</Text>
        <Text style={styles.farmer}>🌾 Sold by: {product.farmer || 'Unknown Farmer'}</Text>

        {product.stock !== undefined && (
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>
              {product.stock > 0 ? `✅ ${product.stock} in stock` : '❌ Out of stock'}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this product</Text>
          <Text style={styles.description}>
            {product.description ||
              `Fresh and organic ${product.name.toLowerCase()} straight from the farm. High quality produce guaranteed.`}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, product.stock === 0 && styles.buttonDisabled]}
          onPress={handleAddToCart}
          disabled={product.stock === 0}
        >
          <Text style={styles.buttonText}>
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart 🛒'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', width: '100%', maxWidth: 800, alignSelf: 'center' },
  image: { width: '100%', height: 280 },
  detailsContainer: { padding: 20 },
  name: { fontSize: 26, fontWeight: 'bold', marginBottom: 8, color: '#1a1a1a' },
  price: { fontSize: 24, color: '#2e7d32', fontWeight: 'bold', marginBottom: 8 },
  farmer: { fontSize: 16, color: '#555', marginBottom: 16 },
  stockBadge: {
    backgroundColor: '#f0f4f0', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, alignSelf: 'flex-start', marginBottom: 20,
  },
  stockText: { fontSize: 14, color: '#444', fontWeight: '600' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  description: { fontSize: 16, color: '#444', lineHeight: 26 },
  button: { backgroundColor: '#2e7d32', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
