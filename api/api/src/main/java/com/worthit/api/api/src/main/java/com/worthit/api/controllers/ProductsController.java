package com.worthit.api.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;

@RestController
public class ProductsController {

    @GetMapping("/api/products")
    public List<Map<String, Object>> getProducts() {
        return List.of(
            Map.of(
                "id", 1,
                "name", "Worth It Glow Serum",
                "price", 29.99,
                "image", "/assets/media/product1.jpg"
            ),
            Map.of(
                "id", 2,
                "name", "Worth It Hydra Mist",
                "price", 19.99,
                "image", "/assets/media/product2.jpg"
            )
        );
    }
}
