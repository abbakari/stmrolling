"""
Management command to set up initial data for STM Budget system.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.customers.models import Customer
from apps.items.models import Category, Brand, Item

User = get_user_model()


class Command(BaseCommand):
    """Management command to create initial data."""
    
    help = 'Set up initial data for STM Budget system'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--admin-username',
            type=str,
            default='admin',
            help='Username for admin user'
        )
        parser.add_argument(
            '--admin-email',
            type=str,
            default='admin@stmbudget.com',
            help='Email for admin user'
        )
        parser.add_argument(
            '--admin-password',
            type=str,
            default='admin123',
            help='Password for admin user'
        )
        parser.add_argument(
            '--skip-demo-data',
            action='store_true',
            help='Skip creating demo data'
        )
    
    def handle(self, *args, **options):
        """Execute the command."""
        self.stdout.write(
            self.style.SUCCESS('Setting up initial data for STM Budget...')
        )
        
        # Create superuser/admin
        self.create_admin_user(options)
        
        # Create sample users
        self.create_sample_users()
        
        if not options['skip_demo_data']:
            # Create demo data
            self.create_demo_categories()
            self.create_demo_brands()
            self.create_demo_items()
            self.create_demo_customers()
        
        self.stdout.write(
            self.style.SUCCESS('Initial data setup completed successfully!')
        )
    
    def create_admin_user(self, options):
        """Create admin user."""
        username = options['admin_username']
        email = options['admin_email']
        password = options['admin_password']
        
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f'Admin user "{username}" already exists.')
            )
            return
        
        admin_user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            first_name='System',
            last_name='Administrator',
            role=User.Role.ADMIN,
            department='IT'
        )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Created admin user: {username} (password: {password})'
            )
        )
    
    def create_sample_users(self):
        """Create sample users for testing."""
        sample_users = [
            {
                'username': 'manager1',
                'email': 'manager1@stmbudget.com',
                'password': 'manager123',
                'first_name': 'John',
                'last_name': 'Manager',
                'role': User.Role.MANAGER,
                'department': 'Sales'
            },
            {
                'username': 'sales1',
                'email': 'sales1@stmbudget.com',
                'password': 'sales123',
                'first_name': 'Alice',
                'last_name': 'Salesperson',
                'role': User.Role.SALESPERSON,
                'department': 'Sales'
            },
            {
                'username': 'sales2',
                'email': 'sales2@stmbudget.com',
                'password': 'sales123',
                'first_name': 'Bob',
                'last_name': 'Salesperson',
                'role': User.Role.SALESPERSON,
                'department': 'Sales'
            },
            {
                'username': 'viewer1',
                'email': 'viewer1@stmbudget.com',
                'password': 'viewer123',
                'first_name': 'Charlie',
                'last_name': 'Viewer',
                'role': User.Role.VIEWER,
                'department': 'Finance'
            }
        ]
        
        for user_data in sample_users:
            if not User.objects.filter(username=user_data['username']).exists():
                password = user_data.pop('password')
                user = User.objects.create_user(password=password, **user_data)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Created user: {user.username} ({user.get_role_display()})'
                    )
                )
    
    def create_demo_categories(self):
        """Create demo categories."""
        categories = [
            {'code': 'ELEC', 'name': 'Electronics'},
            {'code': 'FURN', 'name': 'Furniture'},
            {'code': 'CLTH', 'name': 'Clothing'},
            {'code': 'BOOK', 'name': 'Books'},
            {'code': 'SPRT', 'name': 'Sports'},
        ]
        
        for cat_data in categories:
            category, created = Category.objects.get_or_create(
                code=cat_data['code'],
                defaults=cat_data
            )
            if created:
                self.stdout.write(f'Created category: {category.name}')
    
    def create_demo_brands(self):
        """Create demo brands."""
        brands = [
            {'code': 'SONY', 'name': 'Sony'},
            {'code': 'APPL', 'name': 'Apple'},
            {'code': 'IKEA', 'name': 'IKEA'},
            {'code': 'NIKE', 'name': 'Nike'},
            {'code': 'ADID', 'name': 'Adidas'},
        ]
        
        for brand_data in brands:
            brand, created = Brand.objects.get_or_create(
                code=brand_data['code'],
                defaults=brand_data
            )
            if created:
                self.stdout.write(f'Created brand: {brand.name}')
    
    def create_demo_items(self):
        """Create demo items."""
        if not Category.objects.exists() or not Brand.objects.exists():
            return
        
        electronics = Category.objects.get(code='ELEC')
        furniture = Category.objects.get(code='FURN')
        sony = Brand.objects.get(code='SONY')
        ikea = Brand.objects.get(code='IKEA')
        
        items = [
            {
                'code': 'SONY-TV-55',
                'name': '55" Sony LED TV',
                'category': electronics,
                'brand': sony,
                'unit_price': 899.99,
                'cost_price': 650.00
            },
            {
                'code': 'IKEA-DESK-001',
                'name': 'IKEA Office Desk',
                'category': furniture,
                'brand': ikea,
                'unit_price': 149.99,
                'cost_price': 100.00
            }
        ]
        
        for item_data in items:
            item, created = Item.objects.get_or_create(
                code=item_data['code'],
                defaults=item_data
            )
            if created:
                self.stdout.write(f'Created item: {item.name}')
    
    def create_demo_customers(self):
        """Create demo customers."""
        if not User.objects.filter(role=User.Role.SALESPERSON).exists():
            return
        
        salesperson = User.objects.filter(role=User.Role.SALESPERSON).first()
        
        customers = [
            {
                'code': 'CUST001',
                'name': 'ABC Electronics Store',
                'email': 'contact@abcelectronics.com',
                'salesperson': salesperson,
                'credit_limit': 50000.00
            },
            {
                'code': 'CUST002',
                'name': 'XYZ Furniture Outlet',
                'email': 'info@xyzfurniture.com',
                'salesperson': salesperson,
                'credit_limit': 30000.00
            }
        ]
        
        for customer_data in customers:
            customer, created = Customer.objects.get_or_create(
                code=customer_data['code'],
                defaults=customer_data
            )
            if created:
                self.stdout.write(f'Created customer: {customer.name}')
