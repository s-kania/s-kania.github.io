FROM ruby:3.4.9-bookworm

WORKDIR /srv/jekyll

ENV LANG=C.UTF-8

COPY Gemfile Gemfile.lock* ./
RUN bundle install

COPY . .

EXPOSE 4000 35729

CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--livereload", "--drafts"]
