package com.worthit.api.controllers;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProductsController {
    @GetMapping("/api/products")
    public List<Map<String, Object>> getProducts() {
        // No merchandise is for sale during pre-launch. Add verified catalog data
        // and server-owned pricing/inventory only when the commerce backend is ready.
        return List.of();
    }
}
