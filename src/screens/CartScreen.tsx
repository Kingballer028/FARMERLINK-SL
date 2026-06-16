import React, { useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { CartContext } from '../context/CartContext';
import { CartItem } from '../types';
import { Ionicons } from '@expo/vector-icons';

export default function CartScreen({ navigation }: any) {
  const { cartItems, removeFromCart, clearCart } = useContext(CartContext);

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image
        source={{
          uri: item.image || 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=150',
        }}
        style={styles.image}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>Le {item.price.toFixed(2)} each</Text>
        <Text style={styles.quantity}>Qty: {item.quantity}</Text>
        <Text style={styles.subtotal}>Subtotal: Le {(item.price * item.quantity).toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(item.id)}>
        <Ionicons name="trash-outline" size={22} color="#e53935" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {cartItems.length > 0 && (
        <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
          <Text style={styles.clearText}>Clear Cart</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={cartItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>Your cart is empty.</Text>
            <Text style={styles.emptySubText}>Go add some fresh produce!</Text>
          </View>
        }
      />
      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.totalText}>Total: Le {total.toFixed(2)}</Text>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => navigation.navigate('Checkout', { total })}
          >
            <Text style={styles.checkoutText}>Proceed to Checkout →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', width: '100%', maxWidth: 800, alignSelf: 'center' },
  clearBtn: { alignSelf: 'flex-end', margin: 10, padding: 5 },
  clearText: { color: '#e53935', fontWeight: 'bold' },
  cartItem: {
    flexDirection: 'row', backgroundColor: '#fff', margin: 10, padding: 12,
    borderRadius: 12, alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  image: { width: 70, height: 70, borderRadius: 10, marginRight: 12 },
  itemInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  price: { fontSize: 13, color: '#2e7d32', marginTop: 3 },
  quantity: { fontSize: 13, color: '#666', marginTop: 2 },
  subtotal: { fontSize: 14, color: '#333', fontWeight: '600', marginTop: 4 },
  removeBtn: { padding: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, color: '#666', marginTop: 16, fontWeight: 'bold' },
  emptySubText: { fontSize: 14, color: '#aaa', marginTop: 6 },
  footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderColor: '#eee' },
  totalText: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#1a1a1a' },
  checkoutBtn: {
    backgroundColor: '#2e7d32', padding: 16, borderRadius: 12, alignItems: 'center',
  },
  checkoutText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});
