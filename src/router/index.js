import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import HomeView from '../views/HomeView.vue'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { ElMessage } from 'element-plus'

// 导入布局组件
import FrontLayout from '../layout/FrontLayout.vue'
import UserLayout from '../layout/UserLayout.vue'
import AdminLayout from '../layout/AdminLayout.vue'

// 路由配置
const routes = [
  // 前台相关路由 - 使用前台布局
  {
    path: '/',
    component: FrontLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: HomeView,
        meta: { title: '首页', requiresAuth: false }
      },
      // 商品相关路由
      {
        path: 'products',
        name: 'products',
        component: () => import('../views/product/ProductListView.vue'),
        meta: { title: '商品列表', requiresAuth: false }
      },
      {
        path: 'product/:id',
        name: 'product-detail',
        component: () => import('../views/product/ProductDetailView.vue'),
        meta: { title: '商品详情', requiresAuth: false },
      },
      {
        path: 'product/:id/review',
        name: 'product-review',
        component: () => import('../views/review/AddReviewView.vue'),
        meta: { title: '商品评价', requiresAuth: false }
      },

      // 新增：新品上市路由
      {
        path: 'new',
        name: 'new-products',
        component: () => import('../views/product/NewProductsView.vue'),
        meta: { title: '新品上市', requiresAuth: false }
      },
      // 新增：热卖商品路由
      {
        path: 'hot',
        name: 'hot-products',
        component: () => import('../views/product/HotProductsView.vue'),
        meta: { title: '热卖商品', requiresAuth: false }
      },
      // 购物车路由
      {
        path: 'cart',
        name: 'cart',
        component: () => import('../views/cart/CartView.vue'),
        meta: { title: '购物车', requiresAuth: true }
      },
      // 订单相关路由
      {
        path: 'checkout',
        name: 'checkout',
        component: () => import('../views/order/CheckoutView.vue'),
        meta: { title: '结算', requiresAuth: true }
      },
      {
        path: 'order/success',
        name: 'order-success',
        component: () => import('../views/order/OrderSuccessView.vue'),
        meta: { title: '下单成功', requiresAuth: true }
      },
      {
        path: 'order/detail/:orderNo',
        name: 'order-detail',
        component: () => import('../views/order/OrderDetailView.vue'),
        meta: { title: '订单详情', requiresAuth: true }
      },
      {
        path: 'order/pay/:orderNo',
        name: 'order-pay',
        component: () => import('../views/order/PaymentView.vue'),
        meta: { title: '订单支付', requiresAuth: true }
      },
      // 商品评价路由
      {
        path: 'review/add/:productId',
        name: 'add-review',
        component: () => import('../views/review/AddReviewView.vue'),
        meta: { title: '添加评价', requiresAuth: true },
        props: (route) => ({
          productId: Number(route.params.productId),
          orderNo: route.query.orderNo,
          orderItemId: Number(route.query.orderItemId)
        })
      },
      // 推荐页面路由
      {
        path: 'recommendations',
        name: 'recommendations',
        component: () => import('../views/recommendation/RecommendationsView.vue'),
        meta: { title: '为您推荐', requiresAuth: true }
      },
      // 搜索结果页
      {
        path: 'search',
        name: 'search-result',
        component: () => import('../views/search/SearchResultView.vue'),
        meta: { title: '搜索结果', requiresAuth: false }
      },
    ]
  },
  // 不需要套用布局的页面
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
    meta: { title: '注册', requiresAuth: false }
  },
  // 用户中心相关路由 - 使用用户中心布局
  {
    path: '/user',
    component: UserLayout,
    meta: { title: '用户中心', requiresAuth: true },
    redirect: { name: 'user-profile' },
    children: [
      {
        path: 'profile',
        name: 'user-profile',
        component: () => import('../views/user/ProfileView.vue'),
        meta: { title: '个人资料', requiresAuth: true }
      },
      {
        path: 'address',
        name: 'user-address',
        component: () => import('../views/user/AddressView.vue'),
        meta: { title: '收货地址', requiresAuth: true }
      },
      {
        path: 'orders',
        name: 'user-orders',
        component: () => import('../views/user/OrdersView.vue'),
        meta: { title: '我的订单', requiresAuth: true }
      },
      {
        path: 'favorites',
        name: 'user-favorites',
        component: () => import('../views/user/FavoritesView.vue'),
        meta: { title: '我的收藏', requiresAuth: true }
      },
      {
        path: 'reviews',
        name: 'user-reviews',
        component: () => import('../views/user/ReviewsView.vue'),
        meta: { title: '我的评价', requiresAuth: true }
      },
      {
        path: 'behavior',
        name: 'user-behavior',
        component: () => import('../views/user/BehaviorView.vue'),
        meta: { title: '浏览历史', requiresAuth: true }
      },
      {
        path: 'password',
        name: 'change-password',
        component: () => import('../views/user/PasswordView.vue'),
        meta: { title: '修改密码', requiresAuth: true }
      }
    ]
  },
  // 管理员相关路由 - 使用后台布局
  {
    path: '/admin',
    component: AdminLayout,
    meta: { title: '后台管理', requiresAuth: true, requiresAdmin: true },
    redirect: { name: 'admin-dashboard' },
    children: [
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('../views/admin/DashboardView.vue'),
        meta: { title: '控制面板', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('../views/admin/UserManageView.vue'),
        meta: { title: '用户管理', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'categories',
        name: 'admin-categories',
        component: () => import('../views/admin/CategoryManageView.vue'),
        meta: { title: '分类管理', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'products',
        name: 'admin-products',
        component: () => import('../views/admin/ProductManageView.vue'),
        meta: { title: '商品管理', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'product/add',
        name: 'admin-product-add',
        component: () => import('../views/admin/ProductEditView.vue'),
        meta: { title: '添加商品', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'product/edit/:id',
        name: 'admin-product-edit',
        component: () => import('../views/admin/ProductEditView.vue'),
        meta: { title: '编辑商品', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'orders',
        name: 'admin-orders',
        component: () => import('../views/admin/OrderManageView.vue'),
        meta: { title: '订单管理', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'order/detail/:orderNo',
        name: 'admin-order-detail',
        component: () => import('../views/admin/OrderDetailView.vue'),
        meta: { title: '订单详情', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'recommendation',
        name: 'admin-recommendation',
        component: () => import('../views/admin/RecommendationManageView.vue'),
        meta: { title: '推荐管理', requiresAuth: true, requiresAdmin: true }
      }
    ]
  },



  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: '页面不存在', requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 进度条配置
NProgress.configure({ showSpinner: false })

// 路由前置守卫
router.beforeEach(async (to, from, next) => {
  // 开始进度条
  NProgress.start()
  
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 电子商城` : '电子商城'
  
  const userStore = useUserStore()
  
  // 判断该路由是否需要登录权限
  if (to.meta.requiresAuth) {
    // 判断是否有token
    if (userStore.token) {
      // 如果有token但没有用户信息，先尝试获取用户信息
      if (!userStore.userId) {
        try {
          await userStore.getUserInfo()
        } catch (error) {
          console.error('获取用户信息失败，可能token已过期', error)
          // 获取用户信息失败，清除token并跳转到登录页
          userStore.clearUserInfo()
          next({
            path: '/login',
            query: { redirect: to.fullPath, expired: 'true' }
          })
          return
        }
      }
      
      // 判断是否需要管理员权限
      if (to.meta.requiresAdmin && !userStore.isAdmin) {
        // 需要管理员权限但用户不是管理员，跳转到首页
        next({ name: 'home' })
        ElMessage.error('您没有访问该页面的权限')
      } else {
        // 有权限，放行
        next()
      }
    } else {
      // 没有token，跳转到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
  } else {
    // 不需要登录权限的路由
    // 如果已登录且访问的是登录或注册页，则重定向到首页
    if (userStore.token && (to.name === 'login' || to.name === 'register')) {
      next({ name: 'home' })
    } else {
      // 其他情况正常放行
      next()
    }
  }
})

// 路由后置守卫
router.afterEach(() => {
  // 结束进度条
  NProgress.done()
})

export default router
