import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import CreateListingPage from './pages/CreateListingPage';
import MyListingsPage from './pages/MyListingsPage';
import EditListingPage from './pages/EditListingPage';
import BrowseListingsPage from './pages/BrowseListingsPage';
import ListingDetailPage from './pages/ListingDetailPage';
import MakeOfferPage from './pages/MakeOfferPage';
import MyOffersPage from './pages/MyOffersPage';
import OfferThreadPage from './pages/OfferThreadPage';
import DealPage from './pages/DealPage';
import MyDealsPage from './pages/MyDealsPage';
import RateDealPage from './pages/RateDealPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/me" element={<ProfilePage />} />
      <Route path="/me/listings" element={<MyListingsPage />} />
      <Route path="/listings" element={<BrowseListingsPage />} />
      <Route path="/listings/new" element={<CreateListingPage />} />
      <Route path="/listings/:id" element={<ListingDetailPage />} />
      <Route path="/listings/:id/edit" element={<EditListingPage />} />
      <Route path="/listings/:id/offer" element={<MakeOfferPage />} />
      <Route path="/me/offers" element={<MyOffersPage />} />
      <Route path="/offers/:id" element={<OfferThreadPage />} />
      <Route path="/me/deals" element={<MyDealsPage />} />
      <Route path="/deals/:id" element={<DealPage />} />
      <Route path="/deals/:id/rate" element={<RateDealPage />} />
      <Route path="/users/:handle" element={<PublicProfilePage />} />
    </Routes>
  );
}
