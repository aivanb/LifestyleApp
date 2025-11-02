"""Custom pagination for tracking logs"""
from rest_framework.pagination import PageNumberPagination


class LargeResultsSetPagination(PageNumberPagination):
    """Pagination class that allows large page sizes for graph data"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100000  # Allow very large page sizes for historical data queries

