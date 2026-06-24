module HomeFeedPages
  class Generator < Jekyll::Generator
    safe true
    priority :low

    FIRST_PAGE_COUNT = 3
    FOLLOWING_PAGE_COUNT = 6

    def generate(site)
      posts = site.posts.docs
        .reject { |post| post.data['hidden'] == true }
        .sort_by { |post| post.date || post.data['date'] }
        .reverse
      page_groups = build_page_groups(posts)
      total_pages = page_groups.size

      assign_page_data(home_page(site), page_groups[0] || [], 1, total_pages)

      page_groups.each_with_index do |posts_for_page, index|
        page_number = index + 1
        next if page_number == 1

        page = Jekyll::PageWithoutAFile.new(site, site.source, File.join('page', page_number.to_s), 'index.html')
        page.data['layout'] = 'home'
        page.data['title'] = page_title(site, page_number)
        page.data['permalink'] = page_url(page_number)

        assign_page_data(page, posts_for_page, page_number, total_pages)
        site.pages << page
      end
    end

    private

    def build_page_groups(posts)
      first_page = posts.first(FIRST_PAGE_COUNT)
      rest = posts.drop(FIRST_PAGE_COUNT).each_slice(FOLLOWING_PAGE_COUNT).to_a
      groups = [first_page] + rest

      groups.reject(&:empty?)
    end

    def home_page(site)
      site.pages.find { |page| page.name == 'index.html' && page.dir == '/' }
    end

    def assign_page_data(page, posts, page_number, total_pages)
      return unless page

      page.data['home_feed_page'] = page_number
      page.data['home_feed_total_pages'] = total_pages
      page.data['home_feed_posts'] = posts
      page.data['home_feed_start_index'] = start_index(page_number)
      page.data['home_feed_prev_url'] = previous_url(page_number)
      page.data['home_feed_next_url'] = next_url(page_number, total_pages)
    end

    def start_index(page_number)
      return 1 if page_number == 1

      FIRST_PAGE_COUNT + ((page_number - 2) * FOLLOWING_PAGE_COUNT) + 1
    end

    def previous_url(page_number)
      return nil if page_number <= 1
      return '/' if page_number == 2

      page_url(page_number - 1)
    end

    def next_url(page_number, total_pages)
      return nil if page_number >= total_pages

      page_url(page_number + 1)
    end

    def page_title(site, page_number)
      locale = locale_data(site)
      page_label = locale.dig('home', 'feed', 'page_label') || 'PAGE'

      "#{page_label} #{page_number}"
    end

    def page_url(page_number)
      "/page/#{page_number}/"
    end

    def locale_data(site)
      locales = site.data['locales'] || {}
      locales[active_lang(site)] || locales[default_lang(site)] || {}
    end

    def active_lang(site)
      site.config['active_lang'] || default_lang(site)
    end

    def default_lang(site)
      site.config['default_lang'] || site.config['lang'] || 'pl'
    end
  end
end
