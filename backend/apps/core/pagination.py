"""
High-performance pagination classes for large datasets.
"""
from rest_framework.pagination import CursorPagination, PageNumberPagination
from rest_framework.response import Response
from collections import OrderedDict


class OptimizedCursorPagination(CursorPagination):
    """
    Cursor pagination optimized for large datasets.
    Uses cursor-based pagination which is more efficient than offset-based.
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 1000
    ordering = '-created_at'
    cursor_query_param = 'cursor'
    page_query_description = 'The pagination cursor value.'
    template = 'rest_framework/pagination/cursor.html'

    def get_paginated_response(self, data):
        return Response(OrderedDict([
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('count', self.page.paginator.count if hasattr(self.page, 'paginator') else None),
            ('results', data)
        ]))


class OptimizedPageNumberPagination(PageNumberPagination):
    """
    Page number pagination with performance optimizations.
    Use this for smaller datasets or when exact counts are needed.
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 500
    
    def get_paginated_response(self, data):
        return Response(OrderedDict([
            ('count', self.page.paginator.count),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('total_pages', self.page.paginator.num_pages),
            ('current_page', self.page.number),
            ('page_size', self.get_page_size(self.request)),
            ('results', data)
        ]))


class LargeResultsSetPagination(CursorPagination):
    """
    Specialized pagination for very large datasets.
    Disables count queries for maximum performance.
    """
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 2000
    ordering = '-id'
    
    def get_paginated_response(self, data):
        return Response(OrderedDict([
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('results', data),
            ('page_size', self.get_page_size(self.request)),
        ]))
