require 'fileutils'

module BrickFictionI18nOutputCleanup
  TECHNICAL_FILES = %w[
    AGENTS.md
    feed.xml
    robots.txt
    sitemap.xml
  ].freeze

  Jekyll::Hooks.register :site, :post_write do |site|
    default_lang = site.config['default_lang'] || site.config['lang']
    active_lang = site.config['active_lang'] || default_lang
    languages = Array(site.config['languages']).map(&:to_s)
    cleanup_dirs = if active_lang.to_s == default_lang.to_s
                     languages.reject { |lang| lang == default_lang.to_s }.map { |lang| File.join(site.dest, lang) }
                   else
                     [site.dest]
                   end

    cleanup_dirs.each do |dir|
      TECHNICAL_FILES.each do |filename|
        FileUtils.rm_f(File.join(dir, filename))
      end
    end
  end
end
