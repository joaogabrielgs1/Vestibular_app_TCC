package com.tcc.vestibular.ui.main

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.tcc.vestibular.R
import com.tcc.vestibular.databinding.ActivityMainBinding
import com.tcc.vestibular.ui.home.HomeFragment
import com.tcc.vestibular.ui.profile.ProfileFragment
import com.tcc.vestibular.ui.questions.QuestionsFragment

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val targetTab = intent.getStringExtra("TARGET_TAB")
        if (savedInstanceState == null) {
            when (targetTab) {
                "QUESTIONS" -> {
                    binding.bottomNavigation.selectedItemId = R.id.navigation_questions
                    replaceFragment(QuestionsFragment())
                }
                "PROFILE" -> {
                    binding.bottomNavigation.selectedItemId = R.id.navigation_profile
                    replaceFragment(ProfileFragment())
                }
                else -> {
                    binding.bottomNavigation.selectedItemId = R.id.navigation_home
                    replaceFragment(HomeFragment())
                }
            }
        }

        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.navigation_home -> {
                    replaceFragment(HomeFragment())
                    true
                }
                R.id.navigation_questions -> {
                    replaceFragment(QuestionsFragment())
                    true
                }
                R.id.navigation_profile -> {
                    replaceFragment(ProfileFragment())
                    true
                }
                else -> false
            }
        }
    }

    fun selectTab(itemId: Int) {
        binding.bottomNavigation.selectedItemId = itemId
    }

    private fun replaceFragment(fragment: Fragment) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, fragment)
            .commit()
    }
}
