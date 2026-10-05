import mongoose from 'mongoose';
import { connectDB } from '../dist/config/db.js';
import { loginUserService } from '../dist/modules/auth/auth.service.js';
import { createMarketplaceService, getAllMarketplacesService } from '../dist/modules/marketplace/marketplace.service.js';

async function main() {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Database connected successfully.');

  // Step 1: Login with Business Owner credentials
  const loginCredentials = {
    email: 'business.user@teamstreakpromo.com',
    password: 'Password123!'
  };

  console.log(`\nLogging in as Business Owner (${loginCredentials.email})...`);
  const loginResult = await loginUserService(loginCredentials);
  
  console.log('=== Login Successful ===');
  console.log('User ID:', loginResult._id);
  console.log('Name:', loginResult.name);
  console.log('Email:', loginResult.email);
  console.log('Role:', loginResult.role);
  console.log('Business Profile Name:', loginResult.businessProfile?.businessName);
  console.log('Access Token generated:', loginResult.accessToken ? `${loginResult.accessToken.slice(0, 25)}...` : 'None');

  const businessOwnerId = loginResult._id.toString();

  // Categories available in DB
  const giftCardsCategoryId = '6a9e7795924888db446fa1d6'; // Gift Cards
  const giftCategoryId = '6a9e77ae924888db446fa1d7';      // Gift

  const now = new Date();
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysLater = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const productsToAdd = [
    {
      title: '$50 Amazon Digital Gift Card',
      description: 'Redeem your TeamStreak points for an official $50 Amazon e-Gift Card. Instant digital voucher delivered directly upon reward claim. Valid across all eligible Amazon marketplace items with no expiration date.',
      categoryId: giftCardsCategoryId,
      location: 'Online Digital Voucher - Acme Business Solutions',
      latitude: 44.0462,
      longitude: -123.0220,
      startDateTime: now.toISOString(),
      endDateTime: sixtyDaysLater.toISOString(),
      points: 500,
      quantity: 50,
      photos: [
        'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80'
      ],
      isActive: true,
    },
    {
      title: '$25 Starbucks Coffee & Treat Card',
      description: 'Enjoy premium roasted coffee, artisanal pastries, and handcrafted beverages with a $25 Starbucks e-Card. Compatible with Starbucks mobile app for easy in-store scanning and contactless rewards.',
      categoryId: giftCardsCategoryId,
      location: 'All Participating Starbucks Locations & Mobile App',
      latitude: 44.0462,
      longitude: -123.0220,
      startDateTime: now.toISOString(),
      endDateTime: sixtyDaysLater.toISOString(),
      points: 250,
      quantity: 80,
      photos: [
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80'
      ],
      isActive: true,
    },
    {
      title: 'Executive Stainless Steel Insulated Tumbler (32oz)',
      description: 'Custom laser-engraved double-wall vacuum insulated tumbler keeping drinks ice-cold for 24 hours or piping hot for up to 12 hours. Features leak-proof flip lid, ergonomic silicone grip, and durable powder coat finish.',
      categoryId: giftCategoryId,
      location: 'Acme Business Center - 742 Evergreen Terrace, Springfield, OR',
      latitude: 44.0462,
      longitude: -123.0220,
      startDateTime: now.toISOString(),
      endDateTime: thirtyDaysLater.toISOString(),
      points: 350,
      quantity: 40,
      photos: [
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=800&q=80'
      ],
      isActive: true,
    },
    {
      title: 'Acme Premium Ergonomic Wireless Charging Desk Pad',
      description: 'Ultra-smooth waterproof vegan leather desk mat with built-in 15W Qi fast wireless charging zone for smartphones and earbuds. Non-slip suede base, stitched border edges, and sleek minimalist workspace styling.',
      categoryId: giftCategoryId,
      location: 'Acme Distribution Hub - 742 Evergreen Terrace, Springfield, OR',
      latitude: 44.0462,
      longitude: -123.0220,
      startDateTime: now.toISOString(),
      endDateTime: thirtyDaysLater.toISOString(),
      points: 650,
      quantity: 30,
      photos: [
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&w=800&q=80'
      ],
      isActive: true,
    },
    {
      title: 'Noise-Cancelling Wireless Bluetooth Headphones',
      description: 'High-fidelity audio with active noise cancellation (ANC), 40-hour battery life, plush memory foam ear cushions, and crystal-clear beamforming microphone for team meetings and multimedia listening.',
      categoryId: giftCategoryId,
      location: 'Acme Technology Showcase, Springfield, OR',
      latitude: 44.0462,
      longitude: -123.0220,
      startDateTime: now.toISOString(),
      endDateTime: sixtyDaysLater.toISOString(),
      points: 1200,
      quantity: 20,
      photos: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80'
      ],
      isActive: true,
    }
  ];

  console.log(`\nAdding ${productsToAdd.length} products to Marketplace...`);
  const createdItems = [];

  for (const item of productsToAdd) {
    try {
      const created = await createMarketplaceService(businessOwnerId, item);
      console.log(`[CREATED] ID: ${created._id} | Title: "${created.title}" | Points: ${created.points} | Qty: ${created.quantity}`);
      createdItems.push(created);
    } catch (err) {
      console.error(`[ERROR] Failed to create "${item.title}":`, err.message || err);
    }
  }

  console.log(`\nSuccessfully added ${createdItems.length} products!`);

  // Verify by querying all marketplaces for this business owner
  const myItems = await mongoose.connection.db.collection('marketplaces').find({
    businessOwnerId: loginResult._id
  }).toArray();

  console.log(`\nTotal products now in marketplace for ${loginResult.name}: ${myItems.length}`);
  for (const item of myItems) {
    console.log(` - ${item._id}: ${item.title} (${item.points} pts, Stock: ${item.quantity})`);
  }

  await mongoose.disconnect();
  console.log('\nFinished and disconnected.');
}

main().catch(console.error);
