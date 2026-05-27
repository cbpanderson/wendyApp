package com.wendyapp.backend.listings;

import com.wendyapp.backend.domain.CategoryRepository;
import com.wendyapp.backend.listings.dto.CategoryDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/categories")
public class CategoriesController {

    private final CategoryRepository categories;

    public CategoriesController(CategoryRepository categories) {
        this.categories = categories;
    }

    @GetMapping
    public List<CategoryDto> list() {
        return categories.findAllByActiveTrueOrderByNameAsc().stream()
                .map(CategoryDto::from)
                .toList();
    }
}
