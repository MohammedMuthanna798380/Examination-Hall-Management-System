<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('public.distribution_rules', function (Blueprint $table) {
            $table->id();
            $table->string('rule_name')->unique();
            $table->text('rule_description');
            $table->json('rule_parameters'); // المعاملات الخاصة بالقاعدة
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(1); // أولوية تطبيق القاعدة
            $table->timestamps();

            $table->index(['is_active', 'priority']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('public.distribution_rules');
    }
};
