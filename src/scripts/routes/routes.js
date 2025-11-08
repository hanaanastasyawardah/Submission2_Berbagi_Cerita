import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import AddStoryPage from '../pages/add-story/add-story-page';
import MyStoriesPage from '../pages/my-stories/my-stories-page';
import FavoritesPage from '../pages/favorites/favorites-page';
import LoginPage from '../pages/auth/login-page';
import RegisterPage from '../pages/auth/register-page';

const routes = {
  '/': HomePage,
  '/about': AboutPage,
  '/add-story': AddStoryPage,
  '/my-stories': MyStoriesPage,
  '/favorites': FavoritesPage,
  '/login': LoginPage,
  '/register': RegisterPage,
};

export default routes;