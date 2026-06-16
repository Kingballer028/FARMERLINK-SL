import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import * as WebBrowser from 'expo-web-browser';

export default function CheckoutScreen({ route, navigation }: any) {
  const { total } = route.params;
  const { user } = useContext(AuthContext);
  const { cartItems, clearCart } = useContext(CartContext);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Orange Money');
  const [loading, setLoading] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [expectedCode, setExpectedCode] = useState('');

  const initiatePayment = async () => {
    if (!address || !phone) {
      Alert.alert('Error', 'Please enter your delivery address and phone number.');
      return;
    }
    setLoading(true);
    try {
      // Map cart items to Monime line items format
      const lineItems = cartItems.map((item: any) => ({
        type: 'custom',
        name: item.name || 'Item',
        price: {
          currency: 'SLE',
          value: Math.round(item.price * 100)
        },
        quantity: item.quantity || 1
      }));

      // Initialize Monime Payment
      const monimePayload = {
        name: `Order from ${user?.email || 'Guest'}`,
        successUrl: 'https://monime.io/success',
        cancelUrl: 'https://monime.io/cancel',
        lineItems: lineItems
      };

      const response = await fetch('https://api.monime.io/v1/checkout-sessions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mon_cgUAjp4ntlFiwYHgRdKMG5jEJ8hz8WYEKFETkPhVelIM90Acx1ScN8CDJrJmCchI',
          'Monime-Space-Id': 'spc-k6Rq9TLiGHD9TQ5uwtqDes4pwrE',
          'Idempotency-Key': new Date().getTime().toString() + Math.random().toString(36).substring(7),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(monimePayload)
      });

      const data = await response.json();
      const checkoutUrl = data.checkout_url || data.result?.checkout_url || data.redirectUrl || data.result?.redirectUrl;
      const sessionId = data.id || data.result?.id;

      if (response.ok && checkoutUrl && sessionId) {
        // Open Monime Checkout in the in-app browser
        await WebBrowser.openBrowserAsync(checkoutUrl);
        
        // After the browser is closed by the user, verify if they actually paid
        await verifyPaymentSession(sessionId);
      } else {
        console.error('Monime API Error Response Details:', JSON.stringify(data, null, 2));
        throw new Error(JSON.stringify(data) || 'Payment initialization failed from Monime.');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to place order. Please try again.\n' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyPaymentSession = async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.monime.io/v1/checkout-sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mon_cgUAjp4ntlFiwYHgRdKMG5jEJ8hz8WYEKFETkPhVelIM90Acx1ScN8CDJrJmCchI',
          'Monime-Space-Id': 'spc-k6Rq9TLiGHD9TQ5uwtqDes4pwrE',
        }
      });
      const data = await response.json();
      
      const status = data.result?.status || data.status;
      // 'completed', 'processing', or 'pending' if not paid
      if (status === 'completed' || status === 'processing' || status === 'successful') {
        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        setExpectedCode(generatedCode);
        setPaymentInitiated(true);
        
        // Simulate receiving an SMS after successful payment
        setTimeout(() => {
          Alert.alert('📱 MOCK SMS', `Your Monime payment confirmation code is: ${generatedCode}`);
        }, 1000);
      } else {
        Alert.alert('Payment Incomplete', `Payment status is ${status}. You must complete the payment to receive the code.`);
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to verify payment status.');
    } finally {
      setLoading(false);
    }
  };

  const finalizeOrder = async () => {
    if (confirmationCode.trim() !== expectedCode) {
      Alert.alert('Error', 'Invalid confirmation code. Please enter the exact code that was sent to you.');
      return;
    }
    setLoading(true);
    try {
      // Clean cart items to remove any undefined values which cause Firestore errors
      const cleanItems = cartItems.map(item => {
        const cleanItem: any = {};
        Object.keys(item).forEach(key => {
          if ((item as any)[key] !== undefined) {
            cleanItem[key] = (item as any)[key];
          }
        });
        return cleanItem;
      });

      // Save order to Firestore
      await addDoc(collection(db, 'orders'), {
        buyerId: user?.id || 'unknown',
        buyerEmail: user?.email || 'unknown',
        items: cleanItems,
        total,
        paymentMethod,
        confirmationCode,
        status: 'Processing',
        deliveryAddress: address,
        phoneNumber: phone,
        createdAt: new Date().toISOString(),
      });
      clearCart();
      Alert.alert(
        '🎉 Order Confirmed!',
        `Your order has been placed successfully using ${paymentMethod}!\n\nTotal: Le ${total.toFixed(2)}\nDelivery to: ${address}`,
        [{ text: 'Go Home', onPress: () => navigation.navigate('Home') }]
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to confirm order. Please try again.\n' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.title}>Order Summary</Text>
        {cartItems.map(item => (
          <View key={item.id} style={styles.summaryRow}>
            <Text style={styles.summaryItem}>{item.name} × {item.quantity}</Text>
            <Text style={styles.summaryPrice}>Le {(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>Le {total.toFixed(2)}</Text>
        </View>
      </View>

      {!paymentInitiated ? (
        <>
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>

            <Text style={styles.label}>Delivery Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full address"
              value={address}
              onChangeText={setAddress}
              multiline
            />

            <Text style={styles.label}>Mobile Number (for delivery contact)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. +232 76 000 000"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentMethods}>
              {['Orange Money', 'Afrimoney'].map(method => (
                <TouchableOpacity
                  key={method}
                  style={[styles.paymentBtn, paymentMethod === method && styles.paymentBtnSelected]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text style={[styles.paymentText, paymentMethod === method && styles.paymentTextSelected]}>
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.payBtn, loading && styles.payBtnDisabled]}
            onPress={initiatePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payText}>Proceed to Payment</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Confirm Payment</Text>
            <Text style={styles.label}>Please enter the confirmation code sent to you via SMS/Email after making the payment.</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 123456 or TXN123"
              value={confirmationCode}
              onChangeText={setConfirmationCode}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.payBtn, loading && styles.payBtnDisabled]}
            onPress={finalizeOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payText}>Confirm & Place Order ✔</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.cancelBtn, loading && styles.payBtnDisabled]}
            onPress={() => setPaymentInitiated(false)}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Back</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5', width: '100%', maxWidth: 800, alignSelf: 'center' },
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 20, elevation: 2,
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 14, color: '#1a1a1a' },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8,
  },
  summaryItem: { fontSize: 14, color: '#444', flex: 1 },
  summaryPrice: { fontSize: 14, color: '#333', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
  form: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: {
    backgroundColor: '#fff', padding: 14, borderRadius: 10,
    marginBottom: 16, borderWidth: 1, borderColor: '#ddd', fontSize: 15,
  },
  payBtn: {
    backgroundColor: '#2e7d32', padding: 17, borderRadius: 12,
    alignItems: 'center', marginBottom: 40,
  },
  payBtnDisabled: { opacity: 0.7 },
  payText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  paymentMethods: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  paymentBtn: {
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 8, borderWidth: 1, borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  paymentBtnSelected: {
    borderColor: '#2e7d32', backgroundColor: '#e8f5e9', borderWidth: 2,
  },
  paymentText: { color: '#666', fontSize: 14, fontWeight: 'bold' },
  paymentTextSelected: { color: '#2e7d32' },
  cancelBtn: {
    padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 40,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc'
  },
  cancelText: { color: '#666', fontSize: 16, fontWeight: 'bold' }
});
