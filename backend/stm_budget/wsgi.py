"""
WSGI config for stm_budget project.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stm_budget.settings')

application = get_wsgi_application()
