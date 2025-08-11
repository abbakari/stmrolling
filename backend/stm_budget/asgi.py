"""
ASGI config for stm_budget project.
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stm_budget.settings')

application = get_asgi_application()
